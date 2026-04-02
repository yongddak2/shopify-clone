package com.shopify.backend.domain.order.dto;

import com.shopify.backend.domain.order.entity.Order;
import com.shopify.backend.domain.order.entity.OrderItem;
import com.shopify.backend.domain.order.entity.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class OrderResponse {

    private final Long id;
    private final String orderNumber;
    private final OrderStatus status;
    private final BigDecimal totalAmount;
    private final BigDecimal discountAmount;
    private final BigDecimal deliveryFee;
    private final BigDecimal finalAmount;
    private final String recipient;
    private final String phone;
    private final String address;
    private final String memo;
    private final LocalDateTime createdAt;
    private final List<OrderItemResponse> items;

    public static OrderResponse from(Order order, List<OrderItem> orderItems) {
        List<OrderItemResponse> items = orderItems.stream()
                .map(OrderItemResponse::from)
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .deliveryFee(order.getDeliveryFee())
                .finalAmount(order.getFinalAmount())
                .recipient(order.getRecipient())
                .phone(order.getPhone())
                .address(order.getAddress())
                .memo(order.getMemo())
                .createdAt(order.getCreatedAt())
                .items(items)
                .build();
    }
}
