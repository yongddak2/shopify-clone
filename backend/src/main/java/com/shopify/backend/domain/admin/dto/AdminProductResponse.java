package com.shopify.backend.domain.admin.dto;

import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminProductResponse {

    private final Long id;
    private final String name;
    private final String description;
    private final BigDecimal basePrice;
    private final BigDecimal discountRate;
    private final ProductStatus status;
    private final int viewCount;
    private final Long categoryId;
    private final LocalDateTime createdAt;
    private final LocalDateTime deletedAt;
    private final List<ProductImageDto> images;
    private final List<ProductOptionGroupDto> optionGroups;

    @Getter
    @Builder
    public static class ProductImageDto {
        private final Long id;
        private final String url;
        private final int sortOrder;
        private final boolean isThumbnail;
    }

    @Getter
    @Builder
    public static class ProductOptionGroupDto {
        private final Long id;
        private final String name;
        private final List<ProductOptionValueDto> values;
    }

    @Getter
    @Builder
    public static class ProductOptionValueDto {
        private final Long id;
        private final String value;
        private final BigDecimal additionalPrice;
        private final int stockQuantity;
    }

    public static AdminProductResponse from(Product product) {
        List<ProductImageDto> images = product.getImages().stream()
                .map(image -> ProductImageDto.builder()
                        .id(image.getId())
                        .url(image.getUrl())
                        .sortOrder(image.getSortOrder())
                        .isThumbnail(image.isThumbnail())
                        .build())
                .toList();

        List<ProductOptionGroupDto> optionGroups = product.getOptionGroups().stream()
                .map(group -> ProductOptionGroupDto.builder()
                        .id(group.getId())
                        .name(group.getName())
                        .values(group.getOptionValues().stream()
                                .map(value -> ProductOptionValueDto.builder()
                                        .id(value.getId())
                                        .value(value.getValue())
                                        .additionalPrice(value.getAdditionalPrice())
                                        .stockQuantity(value.getStockQuantity())
                                        .build())
                                .toList())
                        .build())
                .toList();

        return AdminProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .discountRate(product.getDiscountRate())
                .status(product.getStatus())
                .viewCount(product.getViewCount())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .createdAt(product.getCreatedAt())
                .deletedAt(product.getDeletedAt())
                .images(images)
                .optionGroups(optionGroups)
                .build();
    }
}
