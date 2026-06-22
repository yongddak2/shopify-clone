package com.pantrka.backend.domain.order.repository;

import com.pantrka.backend.domain.order.entity.CartItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    // 소프트 삭제된 상품(deletedAt != null)은 장바구니 조회에서 제외
    @EntityGraph(attributePaths = {"product.images"})
    List<CartItem> findByMemberIdAndProductDeletedAtIsNull(Long memberId);

    Optional<CartItem> findByMemberIdAndProductIdAndOptionValueId(Long memberId, Long productId, Long optionValueId);

    // 상품 삭제 시 해당 상품의 장바구니 항목 일괄 정리
    long deleteByProductId(Long productId);
}
