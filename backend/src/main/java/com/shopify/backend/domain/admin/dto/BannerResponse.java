package com.shopify.backend.domain.admin.dto;

import com.shopify.backend.domain.admin.entity.Banner;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BannerResponse {

    private Long id;
    private String imageUrl;
    private int sortOrder;
    private boolean isActive;
    private String linkUrl;
    private LocalDateTime createdAt;

    public static BannerResponse from(Banner banner) {
        return BannerResponse.builder()
                .id(banner.getId())
                .imageUrl(banner.getImageUrl())
                .sortOrder(banner.getSortOrder())
                .isActive(banner.isActive())
                .linkUrl(banner.getLinkUrl())
                .createdAt(banner.getCreatedAt())
                .build();
    }
}
