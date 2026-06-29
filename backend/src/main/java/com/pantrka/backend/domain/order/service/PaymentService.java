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
        if (existing != null && existing.getPaymentKey().equals(request.getTid())
                && (existing.getStatus() == PaymentStatus.DONE
                || existing.getStatus() == PaymentStatus.READY)) {
            return PaymentResponse.from(existing);
        }
        if (existing != null) {
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

        PaymentMethod method = toPaymentMethod(approved.getPayMethod());
        Payment payment = Payment.builder()
                    .order(order)
                    .paymentKey(request.getTid())
                    .method(method)
                    .amount(request.getAmount())
                    .status(PaymentStatus.READY)
                    .build();
        recordApprovedDetails(payment, approved);

        if ("ready".equalsIgnoreCase(approved.getStatus())) {
            paymentRepository.save(payment);
            return PaymentResponse.from(payment);
        }

        try {
            completePaidOrder(order, payment, method);
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
    public void processNiceWebhook(NicePaymentApiResponse event) {
        if (isBlank(event.getOrderId())) {
            return;
        }
        Order order = orderRepository.findByOrderNumberForUpdate(event.getOrderId()).orElse(null);
        if (order == null) {
            return;
        }
        validateWebhook(event);
        if (event.getAmount() == null || event.getAmount().compareTo(order.getFinalAmount()) != 0) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (payment != null && !payment.getPaymentKey().equals(event.getTid())) {
            throw new BusinessException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }
        if (payment == null) {
            payment = Payment.builder()
                    .order(order)
                    .paymentKey(event.getTid())
                    .method(toPaymentMethod(event.getPayMethod()))
                    .amount(event.getAmount())
                    .status(PaymentStatus.READY)
                    .build();
        }
        recordApprovedDetails(payment, event);

        if ("paid".equalsIgnoreCase(event.getStatus())) {
            if (payment.getStatus() != PaymentStatus.DONE) {
                completePaidOrder(order, payment, toPaymentMethod(event.getPayMethod()));
            }
        } else if ("ready".equalsIgnoreCase(event.getStatus())) {
            paymentRepository.save(payment);
        } else if ("cancelled".equalsIgnoreCase(event.getStatus())) {
            payment.cancelPayment();
            paymentRepository.save(payment);
        } else if ("failed".equalsIgnoreCase(event.getStatus())
                || "expired".equalsIgnoreCase(event.getStatus())) {
            payment.failPayment();
            paymentRepository.save(payment);
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

    @Transactional
    public void cancelPendingPayment(Order order, String reason) {
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        if (payment == null || payment.getStatus() != PaymentStatus.READY) {
            return;
        }
        NicePaymentApiResponse cancelled = nicePaymentsClient.cancel(
                payment.getPaymentKey(), order.getOrderNumber(), reason);
        if (!"cancelled".equalsIgnoreCase(cancelled.getStatus())) {
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
        boolean acceptedStatus = "paid".equalsIgnoreCase(response.getStatus())
                || ("vbank".equalsIgnoreCase(response.getPayMethod())
                && "ready".equalsIgnoreCase(response.getStatus()));
        if (!acceptedStatus || !order.getOrderNumber().equals(response.getOrderId())
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

    private void validateWebhook(NicePaymentApiResponse event) {
        if (!"0000".equals(event.getResultCode())
                || isBlank(event.getTid())
                || isBlank(event.getOrderId())
                || event.getAmount() == null
                || isBlank(event.getEdiDate())
                || isBlank(event.getSignature())
                || isBlank(niceProperties.getSecretKey())) {
            throw new BusinessException(ErrorCode.NICEPAY_SIGNATURE_INVALID);
        }
        String expected = sha256(event.getTid()
                + event.getAmount().toPlainString()
                + event.getEdiDate()
                + niceProperties.getSecretKey());
        if (!MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.US_ASCII),
                event.getSignature().toLowerCase().getBytes(StandardCharsets.US_ASCII))) {
            throw new BusinessException(ErrorCode.NICEPAY_SIGNATURE_INVALID);
        }
    }

    private void recordApprovedDetails(Payment payment, NicePaymentApiResponse response) {
        NicePaymentApiResponse.VbankInfo vbank = response.getVbank();
        payment.recordDetails(
                response.getIssuedCashReceipt(),
                response.getReceiptUrl(),
                vbank == null ? null : vbank.getVbankName(),
                vbank == null ? null : vbank.getVbankNumber(),
                vbank == null ? null : vbank.getVbankHolder(),
                vbank == null ? null : vbank.getVbankExpDate());
    }

    private void completePaidOrder(Order order, Payment payment, PaymentMethod method) {
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BusinessException(ErrorCode.ORDER_NOT_PENDING);
        }
        payment.confirmPayment(payment.getPaymentKey(), method);
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
