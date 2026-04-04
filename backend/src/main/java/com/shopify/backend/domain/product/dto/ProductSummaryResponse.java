package com.shopify.backend.domain.product.dto;

import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductImage;
import com.shopify.backend.domain.product.entity.ProductStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Comparator;

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
        String thumbnailUrl = product.getImages().stream()
                .filter(ProductImage::isThumbnail)
                .findFirst()
                .or(() -> product.getImages().stream()
                        .min(Comparator.comparingInt(ProductImage::getSortOrder)))
                .map(ProductImage::getUrl)
                .orElse(null);

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
