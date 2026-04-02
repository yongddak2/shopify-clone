package com.shopify.backend.domain.order.dto;

import com.shopify.backend.domain.order.entity.CartItem;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

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
    private final int quantity;
    private final String thumbnailUrl;

    public static CartItemResponse from(CartItem cartItem) {
        String thumbnailUrl = cartItem.getProduct().getImages().stream()
                .filter(image -> image.isThumbnail())
                .findFirst()
                .map(image -> image.getUrl())
                .orElse(null);

        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(cartItem.getProduct().getId())
                .productName(cartItem.getProduct().getName())
                .optionValueId(cartItem.getOptionValue() != null ? cartItem.getOptionValue().getId() : null)
                .optionValue(cartItem.getOptionValue() != null ? cartItem.getOptionValue().getValue() : null)
                .additionalPrice(cartItem.getOptionValue() != null ? cartItem.getOptionValue().getAdditionalPrice() : null)
                .basePrice(cartItem.getProduct().getBasePrice())
                .quantity(cartItem.getQuantity())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}
