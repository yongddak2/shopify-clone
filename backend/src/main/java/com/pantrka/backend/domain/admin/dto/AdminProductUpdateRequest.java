package com.pantrka.backend.domain.admin.dto;

import com.pantrka.backend.domain.product.entity.ProductStatus;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
public class AdminProductUpdateRequest {

    private String name;
    private String description;
    private String productInfo;
    private BigDecimal basePrice;
    private BigDecimal discountRate;
    private ProductStatus status;
    private Long categoryId;
    private String optionGroupName;
    private List<AdminProductOptionUpdateRequest> optionValues;
    private List<ProductImageDto> images;

    @Getter
    public static class ProductImageDto {
        private Long id; // null이면 신규
        private String url;
        private int sortOrder;
        private boolean isThumbnail;
        private boolean detail;
        private boolean isHover;
    }
}
