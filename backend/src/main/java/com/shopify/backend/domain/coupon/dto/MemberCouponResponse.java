package com.shopify.backend.domain.coupon.dto;

import com.shopify.backend.domain.coupon.entity.DiscountType;
import com.shopify.backend.domain.coupon.entity.MemberCoupon;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class MemberCouponResponse {

    private final Long id;
    private final Long couponId;
    private final String couponName;
    private final DiscountType discountType;
    private final BigDecimal discountValue;
    private final BigDecimal minOrderAmount;
    private final BigDecimal maxDiscountAmount;
    private final LocalDateTime usedAt;
    private final LocalDateTime expiredAt;
    private final LocalDateTime createdAt;
    private final boolean usable;

    public static MemberCouponResponse from(MemberCoupon memberCoupon) {
        return MemberCouponResponse.builder()
                .id(memberCoupon.getId())
                .couponId(memberCoupon.getCoupon().getId())
                .couponName(memberCoupon.getCoupon().getName())
                .discountType(memberCoupon.getCoupon().getDiscountType())
                .discountValue(memberCoupon.getCoupon().getDiscountValue())
                .minOrderAmount(memberCoupon.getCoupon().getMinOrderAmount())
                .maxDiscountAmount(memberCoupon.getCoupon().getMaxDiscountAmount())
                .usedAt(memberCoupon.getUsedAt())
                .expiredAt(memberCoupon.getExpiredAt())
                .createdAt(memberCoupon.getCreatedAt())
                .usable(memberCoupon.isUsable())
                .build();
    }
}
