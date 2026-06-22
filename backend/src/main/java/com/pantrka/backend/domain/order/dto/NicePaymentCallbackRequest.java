package com.pantrka.backend.domain.order.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class NicePaymentCallbackRequest {
    private String authResultCode;
    private String authResultMsg;
    private String tid;
    private String clientId;
    private String orderId;
    private BigDecimal amount;
    private String mallReserved;
    private String authToken;
    private String signature;
}
