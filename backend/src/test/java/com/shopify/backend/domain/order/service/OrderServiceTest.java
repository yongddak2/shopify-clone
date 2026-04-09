package com.shopify.backend.domain.order.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.Provider;
import com.shopify.backend.domain.auth.entity.Role;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.coupon.repository.MemberCouponRepository;
import com.shopify.backend.domain.order.dto.OrderCreateRequest;
import com.shopify.backend.domain.order.entity.*;
import com.shopify.backend.domain.order.repository.CartItemRepository;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.order.repository.OrderRepository;
import com.shopify.backend.domain.order.repository.ReturnExchangeRequestRepository;
import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.repository.ProductOptionValueRepository;
import com.shopify.backend.domain.product.entity.ProductOptionValue;
import com.shopify.backend.domain.product.entity.ProductStatus;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private MemberCouponRepository memberCouponRepository;

    @Mock
    private ReturnExchangeRequestRepository returnExchangeRequestRepository;

    @Mock
    private ProductOptionValueRepository productOptionValueRepository;

    @InjectMocks
    private OrderService orderService;

    private Member member;
    private Product product;
    private ProductOptionValue optionValue;

    @BeforeEach
    void setUp() {
        member = Member.builder()
                .email("test@test.com")
                .password("encoded")
                .name("테스트")
                .phone("010-1234-5678")
                .role(Role.USER)
                .provider(Provider.LOCAL)
                .build();
        ReflectionTestUtils.setField(member, "id", 1L);

        product = Product.builder()
                .name("테스트 상품")
                .basePrice(new BigDecimal("10000"))
                .discountRate(BigDecimal.ZERO)
                .status(ProductStatus.ACTIVE)
                .build();
        ReflectionTestUtils.setField(product, "id", 1L);

        optionValue = ProductOptionValue.builder()
                .value("빨강")
                .additionalPrice(new BigDecimal("1000"))
                .stockQuantity(10)
                .build();
        ReflectionTestUtils.setField(optionValue, "id", 1L);
    }

    private CartItem createCartItem(Member member, Product product, ProductOptionValue optionValue, int quantity) {
        CartItem cartItem = CartItem.builder()
                .member(member)
                .product(product)
                .optionValue(optionValue)
                .quantity(quantity)
                .build();
        ReflectionTestUtils.setField(cartItem, "id", 1L);
        return cartItem;
    }

    private OrderCreateRequest createOrderRequest(List<Long> cartItemIds) {
        OrderCreateRequest request = new OrderCreateRequest();
        ReflectionTestUtils.setField(request, "cartItemIds", cartItemIds);
        ReflectionTestUtils.setField(request, "recipient", "홍길동");
        ReflectionTestUtils.setField(request, "phone", "010-1234-5678");
        ReflectionTestUtils.setField(request, "address", "서울시 강남구");
        ReflectionTestUtils.setField(request, "memo", "부재시 문앞");
        return request;
    }

    @Test
    @DisplayName("주문_생성_성공")
    void 주문_생성_성공() {
        // given
        CartItem cartItem = createCartItem(member, product, optionValue, 2);
        OrderCreateRequest request = createOrderRequest(List.of(1L));

        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(cartItemRepository.findById(1L)).willReturn(Optional.of(cartItem));
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            ReflectionTestUtils.setField(order, "id", 1L);
            return order;
        });
        given(orderItemRepository.saveAll(anyList())).willAnswer(invocation -> invocation.getArgument(0));
        given(productOptionValueRepository.findByIdWithLock(1L)).willReturn(Optional.of(optionValue));

        // when
        var response = orderService.createOrder(1L, request);

        // then
        assertThat(response).isNotNull();
        verify(orderRepository).save(any(Order.class));
        verify(orderItemRepository).saveAll(anyList());
        verify(cartItemRepository).deleteAll(anyList());
        // 재고 차감 확인: 원래 10 - 2 = 8
        assertThat(optionValue.getStockQuantity()).isEqualTo(8);
    }

    @Test
    @DisplayName("장바구니_비어있으면_예외")
    void 장바구니_비어있으면_예외() {
        // given
        OrderCreateRequest request = createOrderRequest(List.of(999L));

        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(cartItemRepository.findById(999L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.CART_ITEM_NOT_FOUND);
    }

    @Test
    @DisplayName("품절_상품_주문_시_예외")
    void 품절_상품_주문_시_예외() {
        // given
        ProductOptionValue soldOutOption = ProductOptionValue.builder()
                .value("파랑")
                .additionalPrice(new BigDecimal("1000"))
                .stockQuantity(0)
                .build();
        ReflectionTestUtils.setField(soldOutOption, "id", 2L);

        CartItem cartItem = CartItem.builder()
                .member(member)
                .product(product)
                .optionValue(soldOutOption)
                .quantity(1)
                .build();
        ReflectionTestUtils.setField(cartItem, "id", 1L);

        OrderCreateRequest request = createOrderRequest(List.of(1L));

        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(cartItemRepository.findById(1L)).willReturn(Optional.of(cartItem));
        given(productOptionValueRepository.findByIdWithLock(2L)).willReturn(Optional.of(soldOutOption));

        // when & then
        assertThatThrownBy(() -> orderService.createOrder(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.OUT_OF_STOCK);
    }

    @Test
    @DisplayName("배송비_무료_조건_확인")
    void 배송비_무료_조건_확인() {
        // given: basePrice 30000 + additionalPrice 1000 = 31000 * quantity 2 = 62000 >= 50000
        Product expensiveProduct = Product.builder()
                .name("고가 상품")
                .basePrice(new BigDecimal("30000"))
                .discountRate(BigDecimal.ZERO)
                .status(ProductStatus.ACTIVE)
                .build();
        ReflectionTestUtils.setField(expensiveProduct, "id", 2L);

        CartItem cartItem = CartItem.builder()
                .member(member)
                .product(expensiveProduct)
                .optionValue(optionValue)
                .quantity(2)
                .build();
        ReflectionTestUtils.setField(cartItem, "id", 1L);

        OrderCreateRequest request = createOrderRequest(List.of(1L));

        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(cartItemRepository.findById(1L)).willReturn(Optional.of(cartItem));
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 1L);
            return saved;
        });
        given(orderItemRepository.saveAll(anyList())).willAnswer(invocation -> invocation.getArgument(0));
        given(productOptionValueRepository.findByIdWithLock(1L)).willReturn(Optional.of(optionValue));

        // when
        var response = orderService.createOrder(1L, request);

        // then
        assertThat(response.getDeliveryFee()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("배송비_유료_조건_확인")
    void 배송비_유료_조건_확인() {
        // given: basePrice 10000 + additionalPrice 1000 = 11000 * quantity 1 = 11000 < 50000
        CartItem cartItem = createCartItem(member, product, optionValue, 1);
        OrderCreateRequest request = createOrderRequest(List.of(1L));

        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(cartItemRepository.findById(1L)).willReturn(Optional.of(cartItem));
        given(orderRepository.save(any(Order.class))).willAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 1L);
            return saved;
        });
        given(orderItemRepository.saveAll(anyList())).willAnswer(invocation -> invocation.getArgument(0));
        given(productOptionValueRepository.findByIdWithLock(1L)).willReturn(Optional.of(optionValue));

        // when
        var response = orderService.createOrder(1L, request);

        // then
        assertThat(response.getDeliveryFee()).isEqualByComparingTo(new BigDecimal("3000"));
    }

    @Test
    @DisplayName("주문_취소_성공")
    void 주문_취소_성공() {
        // given
        Order order = Order.builder()
                .member(member)
                .orderNumber("ORD-123")
                .totalAmount(new BigDecimal("11000"))
                .discountAmount(BigDecimal.ZERO)
                .deliveryFee(new BigDecimal("3000"))
                .finalAmount(new BigDecimal("14000"))
                .status(OrderStatus.PENDING)
                .build();
        ReflectionTestUtils.setField(order, "id", 1L);

        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .product(product)
                .optionValue(optionValue)
                .productNameSnapshot("테스트 상품")
                .priceSnapshot(new BigDecimal("11000"))
                .quantity(2)
                .subtotal(new BigDecimal("22000"))
                .build();

        given(orderRepository.findByIdAndMemberId(1L, 1L)).willReturn(Optional.of(order));
        given(orderItemRepository.findByOrderId(1L)).willReturn(List.of(orderItem));

        int stockBefore = optionValue.getStockQuantity();

        // when
        orderService.cancelOrder(1L, 1L);

        // then
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(optionValue.getStockQuantity()).isEqualTo(stockBefore + 2);
    }

    @Test
    @DisplayName("주문_취소_불가_상태_예외")
    void 주문_취소_불가_상태_예외() {
        // given
        Order order = Order.builder()
                .member(member)
                .orderNumber("ORD-123")
                .totalAmount(new BigDecimal("11000"))
                .discountAmount(BigDecimal.ZERO)
                .deliveryFee(new BigDecimal("3000"))
                .finalAmount(new BigDecimal("14000"))
                .status(OrderStatus.DELIVERED)
                .build();
        ReflectionTestUtils.setField(order, "id", 1L);

        given(orderRepository.findByIdAndMemberId(1L, 1L)).willReturn(Optional.of(order));

        // when & then
        assertThatThrownBy(() -> orderService.cancelOrder(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.ORDER_CANCEL_NOT_ALLOWED);
    }

    @Test
    @DisplayName("다른_사용자_주문_취소_시_예외")
    void 다른_사용자_주문_취소_시_예외() {
        // given: findByIdAndMemberId가 다른 사용자면 Optional.empty 반환
        given(orderRepository.findByIdAndMemberId(1L, 2L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> orderService.cancelOrder(2L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.ORDER_NOT_FOUND);
    }
}
