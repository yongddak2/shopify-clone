package com.pantrka.backend.domain.order.dto;

import com.pantrka.backend.domain.order.entity.Payment;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentResponse {

    private Long id;
    private Long orderId;
    private String orderNumber;
    private String paymentKey;
    private String method;
    private BigDecimal amount;
    private String status;
    private boolean cashReceiptIssued;
    private String receiptUrl;
    private String vbankName;
    private String vbankNumber;
    private String vbankHolder;
    private String vbankExpiresAt;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;

    public static PaymentResponse from(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder().getId())
                .orderNumber(payment.getOrder().getOrderNumber())
                .paymentKey(payment.getPaymentKey())
                .method(payment.getMethod().name())
                .amount(payment.getAmount())
                .status(payment.getStatus().name())
                .cashReceiptIssued(Boolean.TRUE.equals(payment.getCashReceiptIssued()))
                .receiptUrl(payment.getReceiptUrl())
                .vbankName(payment.getVbankName())
                .vbankNumber(payment.getVbankNumber())
                .vbankHolder(payment.getVbankHolder())
                .vbankExpiresAt(payment.getVbankExpiresAt())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
