package com.pantrka.backend.domain.coupon.repository;

import com.pantrka.backend.domain.coupon.entity.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByIdAndEndDateAfter(Long id, LocalDateTime now);

    // 발급 동시성 제어: 쿠폰 행을 비관적 락으로 잠가 한도 초과(lost update) 방지
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE c.id = :id")
    Optional<Coupon> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT c FROM Coupon c " +
            "WHERE c.startDate <= :now AND c.endDate >= :now " +
            "AND (c.totalQuantity IS NULL OR c.issuedQuantity < c.totalQuantity) " +
            "ORDER BY c.endDate ASC")
    List<Coupon> findAvailableCoupons(LocalDateTime now);

    Optional<Coupon> findFirstByIsWelcomeTrueAndEndDateAfter(LocalDateTime now);

    List<Coupon> findByIsWelcomeTrue();
}
