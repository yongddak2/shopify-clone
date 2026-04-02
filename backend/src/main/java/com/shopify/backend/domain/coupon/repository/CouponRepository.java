package com.shopify.backend.domain.coupon.repository;

import com.shopify.backend.domain.coupon.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByIdAndEndDateAfter(Long id, LocalDateTime now);
}
