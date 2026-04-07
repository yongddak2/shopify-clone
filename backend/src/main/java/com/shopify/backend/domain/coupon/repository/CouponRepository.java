package com.shopify.backend.domain.coupon.repository;

import com.shopify.backend.domain.coupon.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByIdAndEndDateAfter(Long id, LocalDateTime now);

    @Query("SELECT c FROM Coupon c " +
            "WHERE c.startDate <= :now AND c.endDate >= :now " +
            "AND c.issuedQuantity < c.totalQuantity " +
            "ORDER BY c.endDate ASC")
    List<Coupon> findAvailableCoupons(LocalDateTime now);
}
