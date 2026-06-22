package com.pantrka.backend.domain.order.service;

import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.domain.auth.entity.Provider;
import com.pantrka.backend.domain.auth.entity.Role;
import com.pantrka.backend.domain.coupon.repository.MemberCouponRepository;
import com.pantrka.backend.domain.order.dto.NicePaymentApiResponse;
import com.pantrka.backend.domain.order.dto.NicePaymentCallbackRequest;
import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import com.pantrka.backend.domain.order.entity.Payment;
import com.pantrka.backend.domain.order.repository.OrderItemRepository;
import com.pantrka.backend.domain.order.repository.OrderRepository;
import com.pantrka.backend.domain.order.repository.PaymentRepository;
import com.pantrka.backend.global.config.NicePaymentsProperties;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock PaymentRepository paymentRepository;
    @Mock OrderRepository orderRepository;
    @Mock OrderItemRepository orderItemRepository;
    @Mock MemberCouponRepository memberCouponRepository;
    @Mock NicePaymentsClient nicePaymentsClient;
    @Mock NicePaymentsProperties niceProperties;
    @Mock EmailService emailService;

    @InjectMocks PaymentService paymentService;

    private Order order;

    @BeforeEach
    void setUp() {
        Member member = Member.builder()
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

    @Test
    void confirmsNicePaymentAfterSignatureAndAmountValidation() {
        NicePaymentCallbackRequest callback = callback("50000", validSignature("50000"));
        NicePaymentApiResponse approved = approvedResponse();
        given(niceProperties.getClientKey()).willReturn("client");
        given(niceProperties.getSecretKey()).willReturn("secret");
        given(orderRepository.findByOrderNumberForUpdate("ORD-123")).willReturn(Optional.of(order));
        given(paymentRepository.findByOrderId(1L)).willReturn(Optional.empty());
        given(nicePaymentsClient.approve("NICE-TID", new BigDecimal("50000"))).willReturn(approved);
        given(orderItemRepository.findByOrderId(1L)).willReturn(List.of());
        given(paymentRepository.save(any(Payment.class))).willAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            ReflectionTestUtils.setField(payment, "id", 1L);
            return payment;
        });

        var response = paymentService.confirmNicePayment(callback);

        assertThat(response.getPaymentKey()).isEqualTo("NICE-TID");
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAID);
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void rejectsInvalidAuthenticationSignature() {
        given(niceProperties.getClientKey()).willReturn("client");
        given(niceProperties.getSecretKey()).willReturn("secret");

        assertThatThrownBy(() -> paymentService.confirmNicePayment(callback("50000", "bad")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.NICEPAY_SIGNATURE_INVALID);
    }

    @Test
    void rejectsAmountMismatchBeforeApproval() {
        given(niceProperties.getClientKey()).willReturn("client");
        given(niceProperties.getSecretKey()).willReturn("secret");
        given(orderRepository.findByOrderNumberForUpdate("ORD-123")).willReturn(Optional.of(order));
        given(paymentRepository.findByOrderId(1L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.confirmNicePayment(
                callback("40000", validSignature("40000"))))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
    }

    private NicePaymentCallbackRequest callback(String amount, String signature) {
        NicePaymentCallbackRequest request = new NicePaymentCallbackRequest();
        request.setAuthResultCode("0000");
        request.setAuthResultMsg("인증 성공");
        request.setTid("NICE-TID");
        request.setClientId("client");
        request.setOrderId("ORD-123");
        request.setAmount(new BigDecimal(amount));
        request.setAuthToken("AUTH-TOKEN");
        request.setSignature(signature);
        return request;
    }

    private NicePaymentApiResponse approvedResponse() {
        NicePaymentApiResponse response = new NicePaymentApiResponse();
        ReflectionTestUtils.setField(response, "resultCode", "0000");
        ReflectionTestUtils.setField(response, "resultMsg", "정상");
        ReflectionTestUtils.setField(response, "tid", "NICE-TID");
        ReflectionTestUtils.setField(response, "orderId", "ORD-123");
        ReflectionTestUtils.setField(response, "status", "paid");
        ReflectionTestUtils.setField(response, "payMethod", "card");
        ReflectionTestUtils.setField(response, "amount", new BigDecimal("50000"));
        return response;
    }

    private String validSignature(String amount) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(("AUTH-TOKEN" + "client" + amount + "secret")
                            .getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
