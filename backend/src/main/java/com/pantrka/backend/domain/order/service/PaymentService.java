package com.pantrka.backend.domain.order.service;

import com.pantrka.backend.domain.coupon.repository.MemberCouponRepository;
import com.pantrka.backend.domain.order.dto.NicePaymentApiResponse;
import com.pantrka.backend.domain.order.dto.NicePaymentCallbackRequest;
import com.pantrka.backend.domain.order.dto.PaymentResponse;
import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderItem;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import com.pantrka.backend.domain.order.entity.Payment;
import com.pantrka.backend.domain.order.entity.PaymentMethod;
import com.pantrka.backend.domain.order.entity.PaymentStatus;
import com.pantrka.backend.domain.order.repository.OrderItemRepository;
import com.pantrka.backend.domain.order.repository.OrderRepository;
import com.pantrka.backend.domain.order.repository.PaymentRepository;
import com.pantrka.backend.global.config.NicePaymentsProperties;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.email.EmailService;
import com.pantrka.backend.infra.email.OrderEmailContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final NicePaymentsClient nicePaymentsClient;
    private final NicePaymentsProperties niceProperties;
    private final EmailService emailService;

    @Transactional
    public PaymentResponse confirmNicePayment(NicePaymentCallbackRequest request) {
        validateAuthenticationResult(request);

        Order order = orderRepository.findByOrderNumberForUpdate(request.getOrderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        Payment existing = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (existing != null && existing.getStatus() == PaymentStatus.DONE) {
            if (existing.getPaymentKey().equals(request.getTid())) {
                return PaymentResponse.from(existing);
            }
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException(ErrorCode.ORDER_NOT_PENDING);
        }
        if (request.getAmount() == null
                || request.getAmount().compareTo(order.getFinalAmount()) != 0) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        NicePaymentApiResponse approved = nicePaymentsClient.approve(
                request.getTid(), request.getAmount());
        validateApprovalResponse(approved, order, request.getTid());

        try {
            Payment payment = existing != null
                    ? existing
                    : Payment.builder()
                    .order(order)
                    .paymentKey(request.getTid())
                    .method(toPaymentMethod(approved.getPayMethod()))
                    .amount(request.getAmount())
                    .status(PaymentStatus.READY)
                    .build();

            payment.confirmPayment(request.getTid(), toPaymentMethod(approved.getPayMethod()));
            paymentRepository.save(payment);
            order.updateStatus(OrderStatus.PAID);

            if (order.getMemberCoupon() != null) {
                order.getMemberCoupon().markUsed();
                memberCouponRepository.save(order.getMemberCoupon());
            }

            List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem orderItem : orderItems) {
                orderItem.getProduct().increaseSalesCount(orderItem.getQuantity());
            }
            emailService.sendPaymentConfirmEmail(OrderEmailContext.from(order, orderItems));
            return PaymentResponse.from(payment);
        } catch (RuntimeException localFailure) {
            try {
                nicePaymentsClient.cancel(
                        request.getTid(), order.getOrderNumber(), "승인 후 주문 처리 실패");
            } catch (RuntimeException ignored) {
                localFailure.addSuppressed(ignored);
            }
            throw localFailure;
        }
    }

    @Transactional
    public void cancelPaidOrder(Order order, String reason) {
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            return;
        }
        if (payment.getStatus() != PaymentStatus.DONE) {
            throw new BusinessException(ErrorCode.PAYMENT_NOT_COMPLETED);
        }

        NicePaymentApiResponse cancelled = nicePaymentsClient.cancel(
                payment.getPaymentKey(), order.getOrderNumber(), reason);
        if (!"cancelled".equalsIgnoreCase(cancelled.getStatus())
                && !"partialCancelled".equalsIgnoreCase(cancelled.getStatus())) {
            throw new BusinessException(ErrorCode.NICEPAY_API_FAILED);
        }
        payment.cancelPayment();
    }

    private void validateAuthenticationResult(NicePaymentCallbackRequest request) {
        if (!"0000".equals(request.getAuthResultCode())
                || isBlank(request.getTid())
                || isBlank(request.getAuthToken())
                || isBlank(request.getSignature())
                || isBlank(request.getOrderId())
                || request.getAmount() == null
                || isBlank(niceProperties.getClientKey())
                || isBlank(niceProperties.getSecretKey())) {
            throw new BusinessException(
                    ErrorCode.NICEPAY_AUTH_FAILED,
                    isBlank(request.getAuthResultMsg())
                            ? ErrorCode.NICEPAY_AUTH_FAILED.getMessage()
                            : request.getAuthResultMsg());
        }
        if (!niceProperties.getClientKey().equals(request.getClientId())) {
            throw new BusinessException(ErrorCode.NICEPAY_SIGNATURE_INVALID);
        }
        String expected = sha256(
                request.getAuthToken()
                        + request.getClientId()
                        + request.getAmount().toPlainString()
                        + niceProperties.getSecretKey());
        if (!MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.US_ASCII),
                request.getSignature().toLowerCase().getBytes(StandardCharsets.US_ASCII))) {
            throw new BusinessException(ErrorCode.NICEPAY_SIGNATURE_INVALID);
        }
    }

    private void validateApprovalResponse(
            NicePaymentApiResponse response, Order order, String expectedTid) {
        if (!"paid".equalsIgnoreCase(response.getStatus())
                || !order.getOrderNumber().equals(response.getOrderId())
                || response.getAmount() == null
                || response.getAmount().compareTo(order.getFinalAmount()) != 0
                || !expectedTid.equals(response.getTid())) {
            throw new BusinessException(ErrorCode.NICEPAY_API_FAILED);
        }
        if (!isBlank(response.getSignature()) && !isBlank(response.getEdiDate())) {
            String expected = sha256(
                    response.getTid()
                            + response.getAmount().toPlainString()
                            + response.getEdiDate()
                            + niceProperties.getSecretKey());
            if (!MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.US_ASCII),
                    response.getSignature().toLowerCase().getBytes(StandardCharsets.US_ASCII))) {
                throw new BusinessException(ErrorCode.NICEPAY_SIGNATURE_INVALID);
            }
        }
    }

    private PaymentMethod toPaymentMethod(String method) {
        if (method == null) return PaymentMethod.CARD;
        return switch (method.toLowerCase()) {
            case "bank" -> PaymentMethod.TRANSFER;
            case "vbank" -> PaymentMethod.VIRTUAL;
            default -> PaymentMethod.CARD;
        };
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256")
                            .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
