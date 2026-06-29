package com.pantrka.backend.domain.order.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class NicePaymentApiResponse {
    private String resultCode;
    private String resultMsg;
    private String tid;
    private String cancelledTid;
    private String orderId;
    private String ediDate;
    private String signature;
    private String status;
    private String paidAt;
    private String cancelledAt;
    private String payMethod;
    private BigDecimal amount;
    private BigDecimal balanceAmt;
    private String receiptUrl;
    private Boolean issuedCashReceipt;
    private VbankInfo vbank;

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VbankInfo {
        private String vbankCode;
        private String vbankName;
        private String vbankNumber;
        private String vbankExpDate;
        private String vbankHolder;
    }
}
