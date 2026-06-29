package com.pantrka.backend.domain.order.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false, unique = true)
    private String paymentKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod method;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    private LocalDateTime paidAt;

    private LocalDateTime cancelledAt;

    private Boolean cashReceiptIssued;

    @Column(length = 500)
    private String receiptUrl;

    private String vbankName;

    private String vbankNumber;

    private String vbankHolder;

    private String vbankExpiresAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Payment(Order order, String paymentKey, PaymentMethod method,
                   BigDecimal amount, PaymentStatus status) {
        this.order = order;
        this.paymentKey = paymentKey;
        this.method = method;
        this.amount = amount;
        this.status = status;
    }

    public void confirmPayment(String paymentKey, PaymentMethod method) {
        this.paymentKey = paymentKey;
        this.method = method;
        this.status = PaymentStatus.DONE;
        this.paidAt = LocalDateTime.now();
    }

    public void recordDetails(Boolean cashReceiptIssued, String receiptUrl,
                              String vbankName, String vbankNumber,
                              String vbankHolder, String vbankExpiresAt) {
        this.cashReceiptIssued = Boolean.TRUE.equals(cashReceiptIssued);
        this.receiptUrl = receiptUrl;
        this.vbankName = vbankName;
        this.vbankNumber = vbankNumber;
        this.vbankHolder = vbankHolder;
        this.vbankExpiresAt = vbankExpiresAt;
    }

    public void cancelPayment() {
        this.status = PaymentStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }

    public void failPayment() {
        this.status = PaymentStatus.FAILED;
    }
}
