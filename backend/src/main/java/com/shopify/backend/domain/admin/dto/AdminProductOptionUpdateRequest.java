package com.shopify.backend.domain.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductOptionUpdateRequest {

    private Long id; // null이면 신규 추가
    private String value;
    private int additionalPrice;
    private int stockQuantity;
}
