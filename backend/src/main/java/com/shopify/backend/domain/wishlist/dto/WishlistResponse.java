package com.shopify.backend.domain.wishlist.dto;

import com.shopify.backend.domain.product.entity.ProductImage;
import com.shopify.backend.domain.wishlist.entity.Wishlist;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Comparator;

@Getter
@Builder
public class WishlistResponse {

    private final Long id;
    private final Long productId;
    private final String productName;
    private final java.math.BigDecimal productPrice;
    private final String thumbnailUrl;
    private final LocalDateTime createdAt;

    public static WishlistResponse from(Wishlist wishlist) {
        String thumbnail = wishlist.getProduct().getImages().stream()
                .filter(ProductImage::isThumbnail)
                .findFirst()
                .or(() -> wishlist.getProduct().getImages().stream()
                        .min(Comparator.comparingInt(ProductImage::getSortOrder)))
                .map(ProductImage::getUrl)
                .orElse(null);

        return WishlistResponse.builder()
                .id(wishlist.getId())
                .productId(wishlist.getProduct().getId())
                .productName(wishlist.getProduct().getName())
                .productPrice(wishlist.getProduct().getBasePrice())
                .thumbnailUrl(thumbnail)
                .createdAt(wishlist.getCreatedAt())
                .build();
    }
}
