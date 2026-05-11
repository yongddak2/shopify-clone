package com.pantrka.backend.domain.coupon.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupon")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @Column(nullable = false)
    private BigDecimal discountValue;

    private BigDecimal minOrderAmount;

    private BigDecimal maxDiscountAmount;

    private Integer totalQuantity;

    @Column(nullable = false)
    private int issuedQuantity;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column(name = "is_welcome", nullable = false)
    private boolean isWelcome;

    @Column(name = "valid_days")
    private Integer validDays;

    @Builder
    public Coupon(String name, DiscountType discountType, BigDecimal discountValue,
                  BigDecimal minOrderAmount, BigDecimal maxDiscountAmount,
                  Integer totalQuantity, LocalDateTime startDate, LocalDateTime endDate,
                  Boolean isWelcome, Integer validDays) {
        this.name = name;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.minOrderAmount = minOrderAmount;
        this.maxDiscountAmount = maxDiscountAmount;
        this.totalQuantity = totalQuantity;
        this.issuedQuantity = 0;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isWelcome = Boolean.TRUE.equals(isWelcome);
        this.validDays = this.isWelcome ? validDays : null;
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        boolean inDateRange = !now.isBefore(startDate) && !now.isAfter(endDate);
        boolean withinLimit = totalQuantity == null || issuedQuantity < totalQuantity;
        return inDateRange && withinLimit;
    }

    public void issue() {
        this.issuedQuantity++;
    }

    public void update(String name, Integer totalQuantity, LocalDateTime startDate, LocalDateTime endDate) {
        this.name = name;
        this.totalQuantity = totalQuantity;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public void markAsWelcome(int validDays) {
        this.isWelcome = true;
        this.validDays = validDays;
    }

    public void unmarkAsWelcome() {
        this.isWelcome = false;
        this.validDays = null;
    }

    public LocalDateTime computeWelcomeExpiredAt(LocalDateTime now) {
        LocalDateTime computed = now.plusDays(validDays);
        return computed.isAfter(endDate) ? endDate : computed;
    }

    public BigDecimal calculateDiscount(BigDecimal orderAmount) {
        BigDecimal discount;
        if (discountType == DiscountType.FIXED) {
            discount = discountValue.min(orderAmount);
        } else {
            discount = orderAmount.multiply(discountValue)
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
            if (maxDiscountAmount != null && discount.compareTo(maxDiscountAmount) > 0) {
                discount = maxDiscountAmount;
            }
        }
        return discount;
    }
}
