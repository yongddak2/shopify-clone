package com.pantrka.backend.domain.coupon.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pantrka.backend.domain.coupon.entity.Coupon;
import com.pantrka.backend.domain.coupon.entity.DiscountType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CouponResponse {

    private final Long id;
    private final String name;
    private final DiscountType discountType;
    private final BigDecimal discountValue;
    private final BigDecimal minOrderAmount;
    private final BigDecimal maxDiscountAmount;
    private final Integer totalQuantity;
    private final int issuedQuantity;
    private final LocalDateTime startDate;
    private final LocalDateTime endDate;

    @JsonProperty("isWelcome")
    private final boolean isWelcome;

    private final Integer validDays;

    public static CouponResponse from(Coupon coupon) {
        return CouponResponse.builder()
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
                .isWelcome(coupon.isWelcome())
                .validDays(coupon.getValidDays())
                .build();
    }
}
