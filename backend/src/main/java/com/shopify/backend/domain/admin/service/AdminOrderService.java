package com.shopify.backend.domain.admin.service;

import com.shopify.backend.domain.admin.dto.AdminOrderResponse;
import com.shopify.backend.domain.admin.dto.AdminOrderStatusUpdateRequest;
import com.shopify.backend.domain.order.entity.Order;
import com.shopify.backend.domain.order.entity.OrderItem;
import com.shopify.backend.domain.order.entity.OrderStatus;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.order.repository.OrderRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public Page<AdminOrderResponse> getOrders(int page, int size) {
        Page<Order> orders = orderRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return orders.map(order -> {
            List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
            return AdminOrderResponse.from(order, orderItems);
        });
    }

    @Transactional
    public void updateOrderStatus(Long orderId, AdminOrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        OrderStatus oldStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        // PAID 이상 상태에서 CANCELLED/REFUNDED로 변경 시 판매량 감소
        boolean wasPaid = oldStatus != OrderStatus.PENDING
                && oldStatus != OrderStatus.CANCELLED
                && oldStatus != OrderStatus.REFUNDED;
        boolean isCancelOrRefund = newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUNDED;

        if (wasPaid && isCancelOrRefund) {
            List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
            for (OrderItem orderItem : orderItems) {
                orderItem.getProduct().decreaseSalesCount(orderItem.getQuantity());
            }
        }

        // 쿠폰 복원 (만료되지 않은 경우만)
        if (isCancelOrRefund && order.getMemberCoupon() != null && order.getMemberCoupon().getUsedAt() != null) {
            if (order.getMemberCoupon().getExpiredAt().isAfter(java.time.LocalDateTime.now())) {
                order.getMemberCoupon().clearUsage();
            }
        }

        order.updateStatus(newStatus);
    }
}
