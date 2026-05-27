package com.pantrka.backend.domain.order.dto;

import com.pantrka.backend.domain.order.entity.OrderItem;
import com.pantrka.backend.domain.product.entity.ProductImage;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

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
        String thumbnailUrl = ProductImage.resolveThumbnailUrl(orderItem.getProduct().getImages());

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
