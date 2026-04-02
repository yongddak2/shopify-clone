package com.shopify.backend.domain.review.repository;

import com.shopify.backend.domain.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByProductIdAndDeletedAtIsNull(Long productId, Pageable pageable);

    Optional<Review> findByMemberIdAndOrderItemId(Long memberId, Long orderItemId);

    boolean existsByMemberIdAndOrderItemId(Long memberId, Long orderItemId);
}
