package com.shopify.backend.domain.order.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.Provider;
import com.shopify.backend.domain.auth.entity.Role;
import com.shopify.backend.domain.order.dto.PaymentConfirmRequest;
import com.shopify.backend.domain.order.entity.*;
import com.shopify.backend.domain.order.repository.OrderRepository;
import com.shopify.backend.domain.order.repository.PaymentRepository;
import com.shopify.backend.global.config.TossPaymentsProperties;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RestTemplate tossRestTemplate;

    @Mock
    private TossPaymentsProperties tossProperties;

    @InjectMocks
    private PaymentService paymentService;

    private Member member;
    private Order order;

    @BeforeEach
    void setUp() {
        member = Member.builder()
                .email("test@test.com")
                .password("encoded")
                .name("테스트")
                .role(Role.USER)
                .provider(Provider.LOCAL)
                .build();
        ReflectionTestUtils.setField(member, "id", 1L);

        order = Order.builder()
                .member(member)
                .orderNumber("ORD-123")
                .totalAmount(new BigDecimal("50000"))
                .discountAmount(BigDecimal.ZERO)
                .deliveryFee(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("50000"))
                .status(OrderStatus.PENDING)
                .build();
        ReflectionTestUtils.setField(order, "id", 1L);
    }

    private PaymentConfirmRequest createRequest(Long orderId, BigDecimal amount) {
        PaymentConfirmRequest request = new PaymentConfirmRequest();
        ReflectionTestUtils.setField(request, "paymentKey", "toss_pay_key_123");
        ReflectionTestUtils.setField(request, "orderId", orderId);
        ReflectionTestUtils.setField(request, "amount", amount);
        return request;
    }

    private void mockTossApiSuccess() {
        given(tossProperties.getSecretKey()).willReturn("test_secret_key");
        given(tossProperties.getConfirmUrl()).willReturn("https://api.tosspayments.com/v1/payments/confirm");
        given(tossRestTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(String.class)))
                .willReturn(ResponseEntity.ok("{}"));
    }

    @Test
    @DisplayName("결제_승인_성공")
    void 결제_승인_성공() {
        // given
        PaymentConfirmRequest request = createRequest(1L, new BigDecimal("50000"));

        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(paymentRepository.findByOrderId(1L)).willReturn(Optional.empty());
        mockTossApiSuccess();
        given(paymentRepository.save(any(Payment.class))).willAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            ReflectionTestUtils.setField(payment, "id", 1L);
            return payment;
        });

        // when
        var response = paymentService.confirmPayment(1L, request);

        // then
        assertThat(response).isNotNull();
        verify(paymentRepository).save(any(Payment.class));
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
    }

    @Test
    @DisplayName("존재하지_않는_주문_예외")
    void 존재하지_않는_주문_예외() {
        // given
        PaymentConfirmRequest request = createRequest(999L, new BigDecimal("50000"));
        given(orderRepository.findById(999L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> paymentService.confirmPayment(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.ORDER_NOT_FOUND);
    }

    @Test
    @DisplayName("다른_사용자_주문_결제_시_예외")
    void 다른_사용자_주문_결제_시_예외() {
        // given
        PaymentConfirmRequest request = createRequest(1L, new BigDecimal("50000"));
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        // when & then: memberId 2L != order.member.id 1L
        assertThatThrownBy(() -> paymentService.confirmPayment(2L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.ORDER_FORBIDDEN);
    }

    @Test
    @DisplayName("PENDING_아닌_상태_결제_시_예외")
    void PENDING_아닌_상태_결제_시_예외() {
        // given
        order.updateStatus(OrderStatus.PAID);
        PaymentConfirmRequest request = createRequest(1L, new BigDecimal("50000"));
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        // when & then
        assertThatThrownBy(() -> paymentService.confirmPayment(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.ORDER_NOT_PENDING);
    }

    @Test
    @DisplayName("이미_결제된_주문_예외")
    void 이미_결제된_주문_예외() {
        // given
        Payment existingPayment = Payment.builder()
                .order(order)
                .paymentKey("existing_key")
                .method(PaymentMethod.CARD)
                .amount(new BigDecimal("50000"))
                .status(PaymentStatus.DONE)
                .build();

        PaymentConfirmRequest request = createRequest(1L, new BigDecimal("50000"));
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(paymentRepository.findByOrderId(1L)).willReturn(Optional.of(existingPayment));

        // when & then
        assertThatThrownBy(() -> paymentService.confirmPayment(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.PAYMENT_ALREADY_PROCESSED);
    }

    @Test
    @DisplayName("금액_불일치_예외")
    void 금액_불일치_예외() {
        // given
        PaymentConfirmRequest request = createRequest(1L, new BigDecimal("99999"));
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(paymentRepository.findByOrderId(1L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> paymentService.confirmPayment(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
    }

    @Test
    @DisplayName("토스_API_실패_시_예외")
    void 토스_API_실패_시_예외() {
        // given
        PaymentConfirmRequest request = createRequest(1L, new BigDecimal("50000"));
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(paymentRepository.findByOrderId(1L)).willReturn(Optional.empty());
        given(tossProperties.getSecretKey()).willReturn("test_secret_key");
        given(tossProperties.getConfirmUrl()).willReturn("https://api.tosspayments.com/v1/payments/confirm");
        given(tossRestTemplate.exchange(anyString(), eq(HttpMethod.POST), any(), eq(String.class)))
                .willThrow(new RestClientException("Connection refused"));

        // when & then
        assertThatThrownBy(() -> paymentService.confirmPayment(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.TOSS_API_FAILED);
    }
}
