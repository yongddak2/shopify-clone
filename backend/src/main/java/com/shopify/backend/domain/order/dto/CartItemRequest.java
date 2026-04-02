package com.shopify.backend.domain.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class CartItemRequest {

    @NotNull(message = "상품 ID는 필수입니다.")
    private Long productId;

    private Long optionValueId;

    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    private int quantity;
}
