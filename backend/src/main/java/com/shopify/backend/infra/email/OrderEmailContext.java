package com.shopify.backend.infra.email;

import com.shopify.backend.domain.coupon.entity.MemberCoupon;
import com.shopify.backend.domain.order.entity.Order;
import com.shopify.backend.domain.order.entity.OrderItem;

import java.math.BigDecimal;
import java.util.List;

public record OrderEmailContext(
        String email,
        String recipientName,
        String orderNumber,
        List<Line> items,
        BigDecimal finalAmount,
        String couponName,
        BigDecimal couponDiscountAmount,
        String shippingRecipient,
        String shippingPhone,
        String shippingAddress,
        String carrier,
        String trackingNumber
) {

    public record Line(
            String productName,
            String optionInfo,
            int quantity,
            BigDecimal subtotal
    ) {
        public static Line from(OrderItem item) {
            return new Line(
                    item.getProductNameSnapshot(),
                    item.getOptionInfoSnapshot(),
                    item.getQuantity(),
                    item.getSubtotal()
            );
        }
    }

    public static OrderEmailContext from(Order order, List<OrderItem> orderItems) {
        MemberCoupon mc = order.getMemberCoupon();
        return new OrderEmailContext(
                order.getMember().getEmail(),
                order.getMember().getName(),
                order.getOrderNumber(),
                orderItems.stream().map(Line::from).toList(),
                order.getFinalAmount(),
                mc != null ? mc.getCoupon().getName() : null,
                order.getDiscountAmount(),
                order.getRecipient(),
                order.getPhone(),
                order.getAddress(),
                order.getCarrier(),
                order.getTrackingNumber()
        );
    }
}
