package com.shopify.backend.domain.order.entity;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.coupon.entity.MemberCoupon;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    private BigDecimal discountAmount;

    private BigDecimal deliveryFee;

    @Column(nullable = false)
    private BigDecimal finalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    private String recipient;

    private String phone;

    private String address;

    private String memo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_coupon_id")
    private MemberCoupon memberCoupon;

    private LocalDateTime confirmedAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems = new ArrayList<>();

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Order(Member member, String orderNumber, BigDecimal totalAmount, BigDecimal discountAmount,
                 BigDecimal deliveryFee, BigDecimal finalAmount, OrderStatus status,
                 String recipient, String phone, String address, String memo, MemberCoupon memberCoupon) {
        this.member = member;
        this.orderNumber = orderNumber;
        this.totalAmount = totalAmount;
        this.discountAmount = discountAmount;
        this.deliveryFee = deliveryFee;
        this.finalAmount = finalAmount;
        this.status = status;
        this.recipient = recipient;
        this.phone = phone;
        this.address = address;
        this.memo = memo;
        this.memberCoupon = memberCoupon;
    }

    public boolean isCancellable() {
        return this.status == OrderStatus.PENDING || this.status == OrderStatus.PAID;
    }

    public void cancel() {
        this.status = OrderStatus.CANCELLED;
    }

    public void updateStatus(OrderStatus status) {
        this.status = status;
    }

    public void confirm() {
        this.confirmedAt = LocalDateTime.now();
    }
}
