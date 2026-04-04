package com.shopify.backend.domain.review.repository;

import com.shopify.backend.domain.review.entity.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    Optional<ReviewLike> findByReviewIdAndMemberId(Long reviewId, Long memberId);

    long countByReviewId(Long reviewId);

    boolean existsByReviewIdAndMemberId(Long reviewId, Long memberId);

    List<ReviewLike> findByReviewIdInAndMemberId(List<Long> reviewIds, Long memberId);

    @Query("SELECT rl.review.id, COUNT(rl) FROM ReviewLike rl WHERE rl.review.id IN :reviewIds GROUP BY rl.review.id")
    List<Object[]> countByReviewIds(@Param("reviewIds") List<Long> reviewIds);
}
