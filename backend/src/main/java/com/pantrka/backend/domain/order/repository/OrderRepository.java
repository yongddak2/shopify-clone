package com.pantrka.backend.domain.order.repository;

import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdAndMemberId(Long id, Long memberId);

    Page<Order> findByMemberIdOrderByCreatedAtDesc(Long memberId, Pageable pageable);

    @EntityGraph(attributePaths = {"memberCoupon"})
    Optional<Order> findByOrderNumber(String orderNumber);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o " +
            "WHERE o.status = :status AND o.createdAt >= :start AND o.createdAt < :end")
    BigDecimal sumFinalAmountByStatusAndCreatedAtBetween(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT o FROM Order o " +
            "WHERE o.status = :status AND o.createdAt >= :start AND o.createdAt < :end")
    List<Order> findByStatusAndCreatedAtBetween(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @EntityGraph(attributePaths = {"member"})
    List<Order> findTop5ByOrderByCreatedAtDesc();

    long countByStatusAndCreatedAtBetween(OrderStatus status, LocalDateTime start, LocalDateTime end);

    @Query("SELECT o.status AS status, COUNT(o) AS count FROM Order o GROUP BY o.status")
    List<Object[]> countGroupByStatus();

    long countByMemberId(Long memberId);

    long countByMemberIdAndStatus(Long memberId, OrderStatus status);

    long countByMemberIdAndStatusIn(Long memberId, List<OrderStatus> statuses);

    @Query("SELECT COALESCE(SUM(o.finalAmount), 0) FROM Order o " +
            "WHERE o.member.id = :memberId AND o.status = :status")
    BigDecimal sumFinalAmountByMemberIdAndStatus(@Param("memberId") Long memberId,
                                                 @Param("status") OrderStatus status);

    Optional<Order> findFirstByMemberIdOrderByCreatedAtDesc(Long memberId);
}
