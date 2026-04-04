package com.shopify.backend.domain.order.repository;

import com.shopify.backend.domain.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdAndMemberId(Long id, Long memberId);

    Page<Order> findByMemberIdOrderByCreatedAtDesc(Long memberId, Pageable pageable);

    @EntityGraph(attributePaths = {"memberCoupon"})
    Optional<Order> findByOrderNumber(String orderNumber);
}
