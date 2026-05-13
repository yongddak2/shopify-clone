package com.pantrka.backend.domain.order.repository;

import com.pantrka.backend.domain.order.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByOrderId(Long orderId);

    List<Payment> findAllByOrderIdIn(Collection<Long> orderIds);
}
