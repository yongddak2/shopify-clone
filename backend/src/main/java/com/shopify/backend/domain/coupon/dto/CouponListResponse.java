package com.shopify.backend.domain.coupon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopify.backend.domain.coupon.entity.Coupon;
import com.shopify.backend.domain.coupon.entity.DiscountType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CouponListResponse {

    private final Long id;
    private final String name;
    private final DiscountType discountType;
    private final BigDecimal discountValue;
    private final BigDecimal minOrderAmount;
    private final BigDecimal maxDiscountAmount;
    private final int totalQuantity;
    private final int issuedQuantity;
    private final LocalDateTime startDate;
    private final LocalDateTime endDate;

    @JsonProperty("isIssued")
    private final boolean isIssued;

    public static CouponListResponse from(Coupon coupon, boolean isIssued) {
        return CouponListResponse.builder()
                .id(coupon.getId())
                .name(coupon.getName())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minOrderAmount(coupon.getMinOrderAmount())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .totalQuantity(coupon.getTotalQuantity())
                .issuedQuantity(coupon.getIssuedQuantity())
                .startDate(coupon.getStartDate())
                .endDate(coupon.getEndDate())
                .isIssued(isIssued)
                .build();
    }
}
