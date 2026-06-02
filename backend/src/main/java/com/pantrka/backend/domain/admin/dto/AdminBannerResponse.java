package com.pantrka.backend.domain.admin.dto;

import com.pantrka.backend.domain.admin.entity.Banner;
import com.pantrka.backend.domain.product.entity.Product;
import com.pantrka.backend.domain.product.entity.ProductImage;
import com.pantrka.backend.domain.product.entity.ProductStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminBannerResponse {

    private Long id;
    private String imageUrl;
    private int sortOrder;
    private boolean isActive;
    private String title;
    private LocalDateTime createdAt;

    // 수정 모달에서 사용하는 원본 값
    private Long productId;
    private String linkUrl;

    // 어드민 화면에 표시할 메타 (productId != null 일 때만 채워짐)
    private LinkedProduct linkedProduct;

    public static AdminBannerResponse from(Banner banner, Product product) {
        LinkedProduct meta = (product != null) ? LinkedProduct.from(product) : null;
        return AdminBannerResponse.builder()
                .id(banner.getId())
                .imageUrl(banner.getImageUrl())
                .sortOrder(banner.getSortOrder())
                .isActive(banner.isActive())
                .title(banner.getTitle())
                .createdAt(banner.getCreatedAt())
                .productId(banner.getProductId())
                .linkUrl(banner.getLinkUrl())
                .linkedProduct(meta)
                .build();
    }

    @Getter
    @Builder
    public static class LinkedProduct {
        private Long id;
        private String name;
        private String thumbnailUrl;
        private ProductStatus status;
        private boolean deleted;

        public static LinkedProduct from(Product product) {
            return LinkedProduct.builder()
                    .id(product.getId())
                    .name(product.getName())
                    .thumbnailUrl(ProductImage.resolveThumbnailUrl(product.getImages()))
                    .status(product.getStatus())
                    .deleted(product.getDeletedAt() != null)
                    .build();
        }
    }
}
