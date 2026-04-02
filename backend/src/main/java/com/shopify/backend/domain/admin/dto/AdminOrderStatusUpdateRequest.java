package com.shopify.backend.domain.admin.dto;

import com.shopify.backend.domain.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class AdminOrderStatusUpdateRequest {

    @NotNull(message = "주문 상태는 필수입니다.")
    private OrderStatus status;
}
