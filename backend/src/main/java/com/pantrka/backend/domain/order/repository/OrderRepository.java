package com.pantrka.backend.domain.order.repository;

import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
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

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"memberCoupon", "member"})
    @Query("SELECT o FROM Order o WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumberForUpdate(@Param("orderNumber") String orderNumber);

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

    @Query(value =
            "SELECT DISTINCT o FROM Order o " +
            "LEFT JOIN o.member m " +
            "LEFT JOIN o.orderItems oi " +
            "WHERE o.status = COALESCE(:status, o.status) " +
            "AND o.createdAt >= COALESCE(:start, o.createdAt) " +
            "AND o.createdAt <= COALESCE(:end, o.createdAt) " +
            "AND (COALESCE(:keyword, '') = '' OR (" +
            "  (:searchType = 'ORDER_NUMBER' AND LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'MEMBER_NAME' AND LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'RECIPIENT' AND LOWER(o.recipient) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'MEMBER_EMAIL' AND LOWER(m.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'TRACKING' AND LOWER(COALESCE(o.trackingNumber, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'PRODUCT_NAME' AND LOWER(oi.productNameSnapshot) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
            "))",
            countQuery =
            "SELECT COUNT(DISTINCT o) FROM Order o " +
            "LEFT JOIN o.member m " +
            "LEFT JOIN o.orderItems oi " +
            "WHERE o.status = COALESCE(:status, o.status) " +
            "AND o.createdAt >= COALESCE(:start, o.createdAt) " +
            "AND o.createdAt <= COALESCE(:end, o.createdAt) " +
            "AND (COALESCE(:keyword, '') = '' OR (" +
            "  (:searchType = 'ORDER_NUMBER' AND LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'MEMBER_NAME' AND LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'RECIPIENT' AND LOWER(o.recipient) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'MEMBER_EMAIL' AND LOWER(m.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'TRACKING' AND LOWER(COALESCE(o.trackingNumber, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
            "  (:searchType = 'PRODUCT_NAME' AND LOWER(oi.productNameSnapshot) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
            "))")
    Page<Order> searchForAdmin(
            @Param("status") OrderStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("searchType") String searchType,
            @Param("keyword") String keyword,
            Pageable pageable);

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
