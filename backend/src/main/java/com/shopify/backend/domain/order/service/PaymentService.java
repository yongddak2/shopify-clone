package com.shopify.backend.domain.order.service;

import com.shopify.backend.domain.coupon.repository.MemberCouponRepository;
import com.shopify.backend.domain.order.dto.PaymentConfirmRequest;
import com.shopify.backend.domain.order.dto.PaymentResponse;
import com.shopify.backend.domain.order.entity.*;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.order.repository.OrderRepository;
import com.shopify.backend.domain.order.repository.PaymentRepository;
import com.shopify.backend.global.config.TossPaymentsProperties;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final RestTemplate tossRestTemplate;
    private final TossPaymentsProperties tossProperties;

    @Transactional
    public PaymentResponse confirmPayment(Long memberId, PaymentConfirmRequest request) {
        // 1. 주문 조회 (orderNumber로 조회, memberCoupon fetch join)
        Order order = orderRepository.findByOrderNumber(request.getOrderNumber())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        // 2. 주문자 본인 확인
        if (!order.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.ORDER_FORBIDDEN);
        }

        // 3. 주문 상태 확인 (PENDING만 결제 가능)
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException(ErrorCode.ORDER_NOT_PENDING);
        }

        // 4. 이미 결제된 주문인지 확인
        paymentRepository.findByOrderId(order.getId()).ifPresent(p -> {
            if (p.getStatus() == PaymentStatus.DONE) {
                throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
            }
        });

        // 5. 금액 일치 확인
        if (request.getAmount().compareTo(order.getFinalAmount()) != 0) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        // 6. 토스페이먼츠 confirm API 호출
        callTossConfirmApi(request.getPaymentKey(), order.getOrderNumber(), request.getAmount());

        // 7. Payment 엔티티 생성 및 저장
        Payment payment = Payment.builder()
                .order(order)
                .paymentKey(request.getPaymentKey())
                .method(PaymentMethod.CARD)
                .amount(request.getAmount())
                .status(PaymentStatus.READY)
                .build();

        payment.confirmPayment(request.getPaymentKey(), PaymentMethod.CARD);
        paymentRepository.save(payment);

        // 8. 주문 상태를 PAID로 변경
        order.updateStatus(OrderStatus.PAID);

        // 8-1. 쿠폰 사용 처리
        if (order.getMemberCoupon() != null) {
            order.getMemberCoupon().markUsed();
            memberCouponRepository.save(order.getMemberCoupon());
        }

        // 9. 판매량 증가
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem orderItem : orderItems) {
            orderItem.getProduct().increaseSalesCount(orderItem.getQuantity());
        }

        return PaymentResponse.from(payment);
    }

    private void callTossConfirmApi(String paymentKey, String orderNumber, java.math.BigDecimal amount) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String encodedKey = Base64.getEncoder()
                .encodeToString((tossProperties.getSecretKey() + ":").getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedKey);

        Map<String, Object> body = Map.of(
                "paymentKey", paymentKey,
                "orderId", orderNumber,
                "amount", amount
        );

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = tossRestTemplate.exchange(
                    tossProperties.getConfirmUrl(),
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new BusinessException(ErrorCode.TOSS_API_FAILED);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TOSS_API_FAILED);
        }
    }
}
