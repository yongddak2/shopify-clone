package com.pantrka.backend.domain.wishlist.repository;

import com.pantrka.backend.domain.wishlist.entity.Wishlist;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    // 소프트 삭제된 상품(deletedAt != null)은 찜 목록 조회에서 제외
    @EntityGraph(attributePaths = {"product.images"})
    List<Wishlist> findByMemberIdAndProductDeletedAtIsNullOrderByCreatedAtDesc(Long memberId);

    Optional<Wishlist> findByMemberIdAndProductId(Long memberId, Long productId);

    boolean existsByMemberIdAndProductId(Long memberId, Long productId);

    long countByMemberId(Long memberId);

    // 상품 삭제 시 해당 상품의 찜 항목 일괄 정리
    long deleteByProductId(Long productId);
}
