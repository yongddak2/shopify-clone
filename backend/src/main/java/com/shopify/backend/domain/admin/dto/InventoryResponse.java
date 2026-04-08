package com.shopify.backend.domain.admin.dto;

import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductOptionValue;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class InventoryResponse {

    private final Long productId;
    private final String productName;
    private final BigDecimal basePrice;
    private final Long optionValueId;
    private final String optionValue;
    private final int stockQuantity;
    private final String status;

    public static InventoryResponse from(Product product, ProductOptionValue optionValue) {
        return InventoryResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .basePrice(product.getBasePrice())
                .optionValueId(optionValue.getId())
                .optionValue(optionValue.getValue())
                .stockQuantity(optionValue.getStockQuantity())
                .status(resolveStatus(optionValue.getStockQuantity()))
                .build();
    }

    private static String resolveStatus(int stockQuantity) {
        if (stockQuantity <= 0) return "품절";
        if (stockQuantity <= 10) return "부족";
        return "정상";
    }
}
