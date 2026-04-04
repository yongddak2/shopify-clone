package com.shopify.backend.domain.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class PaymentConfirmRequest {

    @NotBlank(message = "paymentKey는 필수입니다.")
    private String paymentKey;

    @NotBlank(message = "주문번호는 필수입니다.")
    private String orderNumber;

    @NotNull(message = "결제 금액은 필수입니다.")
    private BigDecimal amount;
}
