package com.shopify.backend.domain.order.dto;

import com.shopify.backend.domain.order.entity.OrderItem;
import com.shopify.backend.domain.product.entity.ProductImage;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Comparator;

@Getter
@Builder
public class OrderItemResponse {

    private final Long id;
    private final Long productId;
    private final String productNameSnapshot;
    private final String optionInfoSnapshot;
    private final BigDecimal priceSnapshot;
    private final int quantity;
    private final BigDecimal subtotal;
    private final String thumbnailUrl;

    public static OrderItemResponse from(OrderItem orderItem) {
        String thumbnailUrl = orderItem.getProduct().getImages().stream()
                .filter(ProductImage::isThumbnail)
                .findFirst()
                .or(() -> orderItem.getProduct().getImages().stream()
                        .min(Comparator.comparingInt(ProductImage::getSortOrder)))
                .map(ProductImage::getUrl)
                .orElse(null);

        return OrderItemResponse.builder()
                .id(orderItem.getId())
                .productId(orderItem.getProduct().getId())
                .productNameSnapshot(orderItem.getProductNameSnapshot())
                .optionInfoSnapshot(orderItem.getOptionInfoSnapshot())
                .priceSnapshot(orderItem.getPriceSnapshot())
                .quantity(orderItem.getQuantity())
                .subtotal(orderItem.getSubtotal())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}
