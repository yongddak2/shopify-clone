package com.shopify.backend.domain.order.dto;

import com.shopify.backend.domain.order.entity.CartItem;
import com.shopify.backend.domain.product.entity.ProductImage;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Comparator;

@Getter
@Builder
public class CartItemResponse {

    private final Long id;
    private final Long productId;
    private final String productName;
    private final Long optionValueId;
    private final String optionValue;
    private final BigDecimal additionalPrice;
    private final BigDecimal basePrice;
    private final BigDecimal discountRate;
    private final int quantity;
    private final String thumbnailUrl;

    public static CartItemResponse from(CartItem cartItem) {
        String thumbnailUrl = cartItem.getProduct().getImages().stream()
                .filter(ProductImage::isThumbnail)
                .findFirst()
                .or(() -> cartItem.getProduct().getImages().stream()
                        .min(Comparator.comparingInt(ProductImage::getSortOrder)))
                .map(ProductImage::getUrl)
                .orElse(null);

        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(cartItem.getProduct().getId())
                .productName(cartItem.getProduct().getName())
                .optionValueId(cartItem.getOptionValue() != null ? cartItem.getOptionValue().getId() : null)
                .optionValue(cartItem.getOptionValue() != null ? cartItem.getOptionValue().getValue() : null)
                .additionalPrice(cartItem.getOptionValue() != null ? cartItem.getOptionValue().getAdditionalPrice() : null)
                .basePrice(cartItem.getProduct().getBasePrice())
                .discountRate(cartItem.getProduct().getDiscountRate())
                .quantity(cartItem.getQuantity())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}
