package com.shopify.backend.domain.coupon.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class CouponApplyResponse {

    private final BigDecimal discountAmount;
    private final BigDecimal finalAmount;
}
