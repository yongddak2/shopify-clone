package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.AdminOrderStatusUpdateRequest;
import com.pantrka.backend.domain.admin.dto.AdminShippingUpdateRequest;
import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import com.pantrka.backend.domain.order.repository.OrderItemRepository;
import com.pantrka.backend.domain.order.repository.OrderRepository;
import com.pantrka.backend.domain.order.repository.PaymentRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.email.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class AdminOrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AdminOrderService adminOrderService;

    @Test
    void shippingRequiresCarrierAndTrackingNumber() {
        Order order = Order.builder()
                .orderNumber("ORDER-1")
                .totalAmount(BigDecimal.TEN)
                .finalAmount(BigDecimal.TEN)
                .status(OrderStatus.PREPARING)
                .build();
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        assertMissingTrackingInfo(orderStatusRequest("", "123456"));
        assertMissingTrackingInfo(orderStatusRequest("CJ대한통운", "  "));

        verifyNoInteractions(emailService);
    }

    @Test
    void updatesShippingInformationForShippedOrder() {
        Order order = orderWithStatus(OrderStatus.SHIPPED);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        adminOrderService.updateOrderShipping(1L, shippingRequest(" CJ ", " 123456 "));

        assertThat(order.getCarrier()).isEqualTo("CJ");
        assertThat(order.getTrackingNumber()).isEqualTo("123456");
        verifyNoInteractions(emailService);
    }

    @Test
    void rejectsShippingUpdateBeforeShipment() {
        Order order = orderWithStatus(OrderStatus.PREPARING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        assertThatThrownBy(() -> adminOrderService.updateOrderShipping(
                1L, shippingRequest("CJ", "123456")))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.SHIPPING_UPDATE_NOT_ALLOWED);
    }

    private void assertMissingTrackingInfo(AdminOrderStatusUpdateRequest request) {
        assertThatThrownBy(() -> adminOrderService.updateOrderStatus(1L, request))
                .isInstanceOf(BusinessException.class)
                .extracting(exception -> ((BusinessException) exception).getErrorCode())
                .isEqualTo(ErrorCode.MISSING_TRACKING_INFO);
    }

    private AdminOrderStatusUpdateRequest orderStatusRequest(String carrier, String trackingNumber) {
        AdminOrderStatusUpdateRequest request = new AdminOrderStatusUpdateRequest();
        ReflectionTestUtils.setField(request, "status", OrderStatus.SHIPPED);
        ReflectionTestUtils.setField(request, "carrier", carrier);
        ReflectionTestUtils.setField(request, "trackingNumber", trackingNumber);
        return request;
    }

    private AdminShippingUpdateRequest shippingRequest(String carrier, String trackingNumber) {
        AdminShippingUpdateRequest request = new AdminShippingUpdateRequest();
        ReflectionTestUtils.setField(request, "carrier", carrier);
        ReflectionTestUtils.setField(request, "trackingNumber", trackingNumber);
        return request;
    }

    private Order orderWithStatus(OrderStatus status) {
        return Order.builder()
                .orderNumber("ORDER-1")
                .totalAmount(BigDecimal.TEN)
                .finalAmount(BigDecimal.TEN)
                .status(status)
                .build();
    }
}
