package com.pantrka.backend.domain.order.dto;

import com.pantrka.backend.domain.order.entity.CartItem;
import com.pantrka.backend.domain.product.entity.ProductImage;
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
    private final BigDecimal discountRate;
    private final int quantity;
    private final int stockQuantity;
    private final String thumbnailUrl;

    public static CartItemResponse from(CartItem cartItem) {
        String thumbnailUrl = ProductImage.resolveThumbnailUrl(cartItem.getProduct().getImages());

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
                .stockQuantity(cartItem.getOptionValue() != null ? cartItem.getOptionValue().getStockQuantity() : 0)
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}
