package com.shopify.backend.domain.order.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.coupon.entity.Coupon;
import com.shopify.backend.domain.coupon.entity.MemberCoupon;
import com.shopify.backend.domain.coupon.repository.MemberCouponRepository;
import com.shopify.backend.domain.order.dto.OrderCreateRequest;
import com.shopify.backend.domain.order.dto.OrderResponse;
import com.shopify.backend.domain.order.entity.CartItem;
import com.shopify.backend.domain.order.entity.Order;
import com.shopify.backend.domain.order.entity.OrderItem;
import com.shopify.backend.domain.order.entity.OrderStatus;
import com.shopify.backend.domain.order.repository.CartItemRepository;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.order.repository.OrderRepository;
import com.shopify.backend.domain.product.entity.ProductOptionValue;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final MemberRepository memberRepository;
    private final MemberCouponRepository memberCouponRepository;

    private static final BigDecimal FREE_DELIVERY_THRESHOLD = new BigDecimal("50000");
    private static final BigDecimal DELIVERY_FEE = new BigDecimal("3000");

    public Page<OrderResponse> getOrders(Long memberId, int page, int size) {
        Page<Order> orders = orderRepository.findByMemberIdOrderByCreatedAtDesc(memberId, PageRequest.of(page, size));
        return orders.map(order -> {
            List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
            return OrderResponse.from(order, orderItems);
        });
    }

    public OrderResponse getOrder(Long memberId, Long orderId) {
        Order order = orderRepository.findByIdAndMemberId(orderId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
        return OrderResponse.from(order, orderItems);
    }

    @Transactional
    public OrderResponse createOrder(Long memberId, OrderCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        // CartItem 목록 조회 및 검증
        List<CartItem> cartItems = new ArrayList<>();
        for (Long cartItemId : request.getCartItemIds()) {
            CartItem cartItem = cartItemRepository.findById(cartItemId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

            if (!cartItem.getMember().getId().equals(memberId)) {
                throw new BusinessException(ErrorCode.CART_ITEM_FORBIDDEN);
            }
            cartItems.add(cartItem);
        }

        // 주문번호 생성
        String orderNumber = "ORD-" + System.currentTimeMillis();

        // 금액 계산 (할인가 적용)
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal HUNDRED = new BigDecimal("100");
        for (CartItem cartItem : cartItems) {
            BigDecimal basePrice = cartItem.getProduct().getBasePrice();
            BigDecimal discountRate = cartItem.getProduct().getDiscountRate();
            BigDecimal discountedPrice = basePrice.multiply(HUNDRED.subtract(discountRate)).divide(HUNDRED, 0, java.math.RoundingMode.FLOOR);
            BigDecimal price = discountedPrice;
            if (cartItem.getOptionValue() != null) {
                price = price.add(cartItem.getOptionValue().getAdditionalPrice());
            }
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            totalAmount = totalAmount.add(subtotal);
        }

        BigDecimal deliveryFee = totalAmount.compareTo(FREE_DELIVERY_THRESHOLD) >= 0
                ? BigDecimal.ZERO : DELIVERY_FEE;
        BigDecimal discountAmount = BigDecimal.ZERO;
        MemberCoupon memberCoupon = null;

        // 쿠폰 적용
        if (request.getMemberCouponId() != null) {
            memberCoupon = memberCouponRepository.findById(request.getMemberCouponId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_COUPON_NOT_FOUND));

            if (!memberCoupon.getMember().getId().equals(memberId)) {
                throw new BusinessException(ErrorCode.COUPON_NOT_OWNED);
            }

            if (memberCoupon.getUsedAt() != null) {
                throw new BusinessException(ErrorCode.COUPON_ALREADY_USED);
            }

            if (memberCoupon.getExpiredAt().isBefore(java.time.LocalDateTime.now())) {
                throw new BusinessException(ErrorCode.COUPON_EXPIRED);
            }

            Coupon coupon = memberCoupon.getCoupon();

            if (coupon.getMinOrderAmount() != null && totalAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
                throw new BusinessException(ErrorCode.COUPON_MIN_ORDER_NOT_MET);
            }

            discountAmount = coupon.calculateDiscount(totalAmount);

            if (discountAmount.compareTo(totalAmount) > 0) {
                discountAmount = totalAmount;
            }
        }

        BigDecimal finalAmount = totalAmount.subtract(discountAmount).add(deliveryFee);

        // Order 생성
        Order order = Order.builder()
                .member(member)
                .orderNumber(orderNumber)
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .deliveryFee(deliveryFee)
                .finalAmount(finalAmount)
                .status(OrderStatus.PENDING)
                .recipient(request.getRecipient())
                .phone(request.getPhone())
                .address(request.getAddress())
                .memo(request.getMemo())
                .memberCoupon(memberCoupon)
                .build();

        orderRepository.save(order);

        // OrderItem 생성 (할인가 적용)
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cartItems) {
            BigDecimal basePrice = cartItem.getProduct().getBasePrice();
            BigDecimal discountRate = cartItem.getProduct().getDiscountRate();
            BigDecimal discountedPrice = basePrice.multiply(HUNDRED.subtract(discountRate)).divide(HUNDRED, 0, java.math.RoundingMode.FLOOR);
            BigDecimal priceSnapshot = discountedPrice;
            if (cartItem.getOptionValue() != null) {
                priceSnapshot = priceSnapshot.add(cartItem.getOptionValue().getAdditionalPrice());
            }
            BigDecimal subtotal = priceSnapshot.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(cartItem.getProduct())
                    .optionValue(cartItem.getOptionValue())
                    .productNameSnapshot(cartItem.getProduct().getName())
                    .optionInfoSnapshot(cartItem.getOptionValue() != null ? cartItem.getOptionValue().getValue() : null)
                    .priceSnapshot(priceSnapshot)
                    .quantity(cartItem.getQuantity())
                    .subtotal(subtotal)
                    .build();

            orderItems.add(orderItem);
        }
        orderItemRepository.saveAll(orderItems);

        // 재고 차감
        for (CartItem cartItem : cartItems) {
            if (cartItem.getOptionValue() != null) {
                cartItem.getOptionValue().decreaseStock(cartItem.getQuantity());
            }
        }

        // 장바구니 항목 삭제
        cartItemRepository.deleteAll(cartItems);

        return OrderResponse.from(order, orderItems);
    }

    @Transactional
    public void confirmOrder(Long memberId, Long orderId) {
        Order order = orderRepository.findByIdAndMemberId(orderId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException(ErrorCode.ORDER_NOT_DELIVERED);
        }

        if (order.getConfirmedAt() != null) {
            throw new BusinessException(ErrorCode.ORDER_ALREADY_CONFIRMED);
        }

        order.confirm();
    }

    @Transactional
    public void cancelOrder(Long memberId, Long orderId) {
        Order order = orderRepository.findByIdAndMemberId(orderId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.isCancellable()) {
            throw new BusinessException(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
        }

        // 재고 복구 + 판매량 감소
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
        for (OrderItem orderItem : orderItems) {
            if (orderItem.getOptionValue() != null) {
                orderItem.getOptionValue().increaseStock(orderItem.getQuantity());
            }
            if (order.getStatus() == OrderStatus.PAID) {
                orderItem.getProduct().decreaseSalesCount(orderItem.getQuantity());
            }
        }

        // 쿠폰 복원 (만료되지 않은 경우만)
        if (order.getMemberCoupon() != null && order.getMemberCoupon().getUsedAt() != null) {
            if (order.getMemberCoupon().getExpiredAt().isAfter(java.time.LocalDateTime.now())) {
                order.getMemberCoupon().clearUsage();
            }
        }

        order.cancel();
    }
}
