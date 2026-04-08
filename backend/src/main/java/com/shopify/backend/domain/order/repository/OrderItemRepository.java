package com.shopify.backend.domain.order.repository;

import com.shopify.backend.domain.order.entity.OrderItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @EntityGraph(attributePaths = {"product.images"})
    List<OrderItem> findByOrderId(Long orderId);

    boolean existsByOptionValueId(Long optionValueId);
}
