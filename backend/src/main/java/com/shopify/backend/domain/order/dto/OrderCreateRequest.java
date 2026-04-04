package com.shopify.backend.domain.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class OrderCreateRequest {

    @NotNull(message = "장바구니 항목 ID 목록은 필수입니다.")
    private List<Long> cartItemIds;

    @NotBlank(message = "수령인은 필수입니다.")
    private String recipient;

    @NotBlank(message = "연락처는 필수입니다.")
    private String phone;

    @NotBlank(message = "배송지는 필수입니다.")
    private String address;

    private String memo;

    private Long memberCouponId;
}
