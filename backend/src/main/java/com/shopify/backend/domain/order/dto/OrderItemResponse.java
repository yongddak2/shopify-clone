package com.shopify.backend.domain.order.dto;

import com.shopify.backend.domain.order.entity.OrderItem;
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

    public static OrderItemResponse from(OrderItem orderItem) {
        return OrderItemResponse.builder()
                .id(orderItem.getId())
                .productId(orderItem.getProduct().getId())
                .productNameSnapshot(orderItem.getProductNameSnapshot())
                .optionInfoSnapshot(orderItem.getOptionInfoSnapshot())
                .priceSnapshot(orderItem.getPriceSnapshot())
                .quantity(orderItem.getQuantity())
                .subtotal(orderItem.getSubtotal())
                .build();
    }
}
