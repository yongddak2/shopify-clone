package com.pantrka.backend.domain.product.dto;

import com.pantrka.backend.domain.product.entity.Product;
import com.pantrka.backend.domain.product.entity.ProductImage;
import com.pantrka.backend.domain.product.entity.ProductStatus;
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
    private final int salesCount;

    public static ProductSummaryResponse from(Product product) {
        String thumbnailUrl = ProductImage.resolveThumbnailUrl(product.getImages());

        return ProductSummaryResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .basePrice(product.getBasePrice())
                .discountRate(product.getDiscountRate())
                .thumbnailUrl(thumbnailUrl)
                .status(product.getStatus())
                .salesCount(product.getSalesCount())
                .build();
    }
}
