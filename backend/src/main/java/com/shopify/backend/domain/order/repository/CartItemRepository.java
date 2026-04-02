package com.shopify.backend.domain.order.repository;

import com.shopify.backend.domain.order.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByMemberId(Long memberId);

    Optional<CartItem> findByMemberIdAndProductIdAndOptionValueId(Long memberId, Long productId, Long optionValueId);
}
