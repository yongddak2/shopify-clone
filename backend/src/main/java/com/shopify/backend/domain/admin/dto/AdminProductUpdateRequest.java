package com.shopify.backend.domain.admin.dto;

import com.shopify.backend.domain.product.entity.ProductStatus;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class AdminProductUpdateRequest {

    private String name;
    private String description;
    private BigDecimal basePrice;
    private BigDecimal discountRate;
    private ProductStatus status;
    private Long categoryId;
}
