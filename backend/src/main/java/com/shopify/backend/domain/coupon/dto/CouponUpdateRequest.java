package com.shopify.backend.domain.coupon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class CouponUpdateRequest {

    @NotBlank(message = "쿠폰 이름은 필수입니다.")
    private String name;

    @NotNull(message = "총 수량은 필수입니다.")
    private Integer totalQuantity;

    @NotNull(message = "시작일은 필수입니다.")
    private LocalDateTime startDate;

    @NotNull(message = "종료일은 필수입니다.")
    private LocalDateTime endDate;
}
