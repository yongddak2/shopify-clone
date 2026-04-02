package com.shopify.backend.domain.coupon.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CouponApplyRequest {

    @NotNull(message = "쿠폰 ID는 필수입니다.")
    private Long memberCouponId;
}
