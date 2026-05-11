package com.pantrka.backend.domain.order.repository;

import com.pantrka.backend.domain.order.entity.RequestStatus;
import com.pantrka.backend.domain.order.entity.ReturnExchangeRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReturnExchangeRequestRepository extends JpaRepository<ReturnExchangeRequest, Long> {

    @EntityGraph(attributePaths = {"images", "order"})
    List<ReturnExchangeRequest> findByOrderId(Long orderId);

    boolean existsByOrderIdAndStatusIn(Long orderId, List<RequestStatus> statuses);

    @EntityGraph(attributePaths = {"order"})
    List<ReturnExchangeRequest> findByOrderIdIn(List<Long> orderIds);

    @EntityGraph(attributePaths = {"images", "order"})
    List<ReturnExchangeRequest> findAllByOrderByCreatedAtDesc();

    @Override
    @EntityGraph(attributePaths = {"images", "order"})
    Page<ReturnExchangeRequest> findAll(Pageable pageable);

    long countByStatus(RequestStatus status);

    @org.springframework.data.jpa.repository.Query(
            "SELECT COUNT(r) FROM ReturnExchangeRequest r WHERE r.order.member.id = :memberId")
    long countByMemberId(@org.springframework.data.repository.query.Param("memberId") Long memberId);
}
