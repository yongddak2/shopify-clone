package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.AdminOrderResponse;
import com.pantrka.backend.domain.admin.dto.AdminOrderStatusUpdateRequest;
import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderItem;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import com.pantrka.backend.domain.order.repository.OrderItemRepository;
import com.pantrka.backend.domain.order.repository.OrderRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.email.EmailService;
import com.pantrka.backend.infra.email.OrderEmailContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final EmailService emailService;

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

        // SHIPPED 전이 시 운송장 정보 저장 (이메일 발송 전에 반영)
        if (oldStatus != newStatus && newStatus == OrderStatus.SHIPPED) {
            if (!StringUtils.hasText(request.getCarrier())
                    && !StringUtils.hasText(request.getTrackingNumber())) {
                throw new BusinessException(ErrorCode.MISSING_TRACKING_INFO);
            }
            order.assignShipping(request.getCarrier(), request.getTrackingNumber());
        }

        order.updateStatus(newStatus);

        // 상태 변경 알림 이메일 (SHIPPED / CANCELLED, 동일 상태로의 재호출은 제외)
        if (oldStatus != newStatus) {
            if (newStatus == OrderStatus.SHIPPED) {
                List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
                emailService.sendShippedEmail(OrderEmailContext.from(order, items));
            } else if (newStatus == OrderStatus.CANCELLED) {
                List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
                emailService.sendAdminCancelEmail(OrderEmailContext.from(order, items));
            }
        }
    }
}
