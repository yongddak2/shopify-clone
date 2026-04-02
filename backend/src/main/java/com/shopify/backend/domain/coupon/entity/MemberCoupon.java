package com.shopify.backend.domain.coupon.entity;

import com.shopify.backend.domain.auth.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "member_coupon")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class MemberCoupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id", nullable = false)
    private Coupon coupon;

    private LocalDateTime usedAt;

    @Column(nullable = false)
    private LocalDateTime expiredAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public MemberCoupon(Member member, Coupon coupon, LocalDateTime expiredAt) {
        this.member = member;
        this.coupon = coupon;
        this.expiredAt = expiredAt;
    }

    public boolean isUsable() {
        return usedAt == null && expiredAt.isAfter(LocalDateTime.now());
    }

    public void use() {
        this.usedAt = LocalDateTime.now();
    }
}
