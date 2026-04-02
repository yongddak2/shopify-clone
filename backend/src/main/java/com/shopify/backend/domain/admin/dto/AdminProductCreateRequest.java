package com.shopify.backend.domain.admin.dto;

import com.shopify.backend.domain.product.entity.ProductStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
public class AdminProductCreateRequest {

    @NotNull(message = "카테고리 ID는 필수입니다.")
    private Long categoryId;

    @NotBlank(message = "상품명은 필수입니다.")
    private String name;

    private String description;

    @NotNull(message = "기본 가격은 필수입니다.")
    @Min(value = 0, message = "기본 가격은 0 이상이어야 합니다.")
    private BigDecimal basePrice;

    private BigDecimal discountRate;

    private ProductStatus status;

    private List<ProductImageDto> images;

    private List<ProductOptionGroupDto> optionGroups;

    @Getter
    public static class ProductImageDto {
        private String url;
        private int sortOrder;
        private boolean isThumbnail;
    }

    @Getter
    public static class ProductOptionGroupDto {
        private String name;
        private List<ProductOptionValueDto> optionValues;
    }

    @Getter
    public static class ProductOptionValueDto {
        private String value;
        private BigDecimal additionalPrice;
        private int stockQuantity;
    }
}
