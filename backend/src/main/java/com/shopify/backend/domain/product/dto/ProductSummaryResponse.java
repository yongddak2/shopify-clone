package com.shopify.backend.domain.product.dto;

import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ProductSummaryResponse {

    private final Long id;
    private final String name;
    private final BigDecimal basePrice;
    private final BigDecimal discountRate;
    private final String thumbnailUrl;
    private final ProductStatus status;

    public static ProductSummaryResponse from(Product product) {
        String thumbnailUrl = product.getImages().stream()
                .filter(image -> image.isThumbnail())
                .findFirst()
                .map(image -> image.getUrl())
                .orElse(null);

        return ProductSummaryResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .basePrice(product.getBasePrice())
                .discountRate(product.getDiscountRate())
                .thumbnailUrl(thumbnailUrl)
                .status(product.getStatus())
                .build();
    }
}
