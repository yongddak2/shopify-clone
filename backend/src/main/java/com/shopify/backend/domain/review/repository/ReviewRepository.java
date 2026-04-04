package com.shopify.backend.domain.review.repository;

import com.shopify.backend.domain.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = {"member", "images", "orderItem"})
    Page<Review> findByProductIdAndDeletedAtIsNull(Long productId, Pageable pageable);

    @EntityGraph(attributePaths = {"member", "images", "orderItem"})
    List<Review> findByMemberIdAndDeletedAtIsNull(Long memberId);

    @EntityGraph(attributePaths = {"member", "images", "orderItem"})
    @Query("SELECT r FROM Review r WHERE r.product.id = :productId AND r.deletedAt IS NULL " +
            "ORDER BY (SELECT COUNT(rl) FROM ReviewLike rl WHERE rl.review = r) DESC, r.createdAt DESC")
    Page<Review> findByProductIdOrderByLikeCount(@Param("productId") Long productId, Pageable pageable);

    Optional<Review> findByMemberIdAndOrderItemId(Long memberId, Long orderItemId);

    boolean existsByMemberIdAndOrderItemIdAndDeletedAtIsNull(Long memberId, Long orderItemId);
}
