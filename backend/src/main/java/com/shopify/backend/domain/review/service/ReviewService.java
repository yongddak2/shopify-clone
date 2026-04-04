package com.shopify.backend.domain.review.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.order.entity.OrderItem;
import com.shopify.backend.domain.order.entity.OrderStatus;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.review.dto.ReviewCreateRequest;
import com.shopify.backend.domain.review.dto.ReviewLikeResponse;
import com.shopify.backend.domain.review.dto.ReviewResponse;
import com.shopify.backend.domain.review.entity.Review;
import com.shopify.backend.domain.review.entity.ReviewImage;
import com.shopify.backend.domain.review.entity.ReviewLike;
import com.shopify.backend.domain.review.repository.ReviewImageRepository;
import com.shopify.backend.domain.review.repository.ReviewLikeRepository;
import com.shopify.backend.domain.review.repository.ReviewRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private static final int MAX_REVIEW_IMAGES = 10;

    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final OrderItemRepository orderItemRepository;
    private final MemberRepository memberRepository;

    public List<ReviewResponse> getMyReviews(Long memberId) {
        List<Review> reviews = reviewRepository.findByMemberIdAndDeletedAtIsNull(memberId);
        List<Long> reviewIds = reviews.stream().map(Review::getId).toList();

        Map<Long, Long> likeCounts = new HashMap<>();
        if (!reviewIds.isEmpty()) {
            reviewLikeRepository.countByReviewIds(reviewIds)
                    .forEach(row -> likeCounts.put((Long) row[0], (Long) row[1]));
        }

        Set<Long> likedReviewIds;
        if (!reviewIds.isEmpty()) {
            likedReviewIds = reviewLikeRepository.findByReviewIdInAndMemberId(reviewIds, memberId)
                    .stream().map(rl -> rl.getReview().getId()).collect(Collectors.toSet());
        } else {
            likedReviewIds = Collections.emptySet();
        }

        return reviews.stream()
                .map(review -> ReviewResponse.from(
                        review,
                        likeCounts.getOrDefault(review.getId(), 0L),
                        likedReviewIds.contains(review.getId())
                ))
                .toList();
    }

    public Page<ReviewResponse> getProductReviews(Long productId, int page, int size, String sort, Long memberId) {
        Page<Review> reviews;

        if ("likes".equals(sort)) {
            reviews = reviewRepository.findByProductIdOrderByLikeCount(productId, PageRequest.of(page, size));
        } else {
            Sort pageSort = switch (sort) {
                case "rating_high" -> Sort.by(Sort.Order.desc("rating"), Sort.Order.desc("createdAt"));
                case "rating_low" -> Sort.by(Sort.Order.asc("rating"), Sort.Order.desc("createdAt"));
                default -> Sort.by(Sort.Direction.DESC, "createdAt");
            };
            reviews = reviewRepository.findByProductIdAndDeletedAtIsNull(productId, PageRequest.of(page, size, pageSort));
        }

        List<Long> reviewIds = reviews.getContent().stream().map(Review::getId).toList();

        Map<Long, Long> likeCounts = new HashMap<>();
        if (!reviewIds.isEmpty()) {
            reviewLikeRepository.countByReviewIds(reviewIds)
                    .forEach(row -> likeCounts.put((Long) row[0], (Long) row[1]));
        }

        Set<Long> likedReviewIds;
        if (memberId != null && !reviewIds.isEmpty()) {
            likedReviewIds = reviewLikeRepository.findByReviewIdInAndMemberId(reviewIds, memberId)
                    .stream().map(rl -> rl.getReview().getId()).collect(Collectors.toSet());
        } else {
            likedReviewIds = Collections.emptySet();
        }

        return reviews.map(review -> ReviewResponse.from(
                review,
                likeCounts.getOrDefault(review.getId(), 0L),
                likedReviewIds.contains(review.getId())
        ));
    }

    @Transactional
    public ReviewResponse createReview(Long memberId, ReviewCreateRequest request) {
        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (orderItem.getOrder().getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException(ErrorCode.ORDER_ITEM_NOT_DELIVERED);
        }

        if (reviewRepository.existsByMemberIdAndOrderItemIdAndDeletedAtIsNull(memberId, request.getOrderItemId())) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        if (request.getImageUrls() != null && request.getImageUrls().size() > MAX_REVIEW_IMAGES) {
            throw new BusinessException(ErrorCode.REVIEW_IMAGE_LIMIT_EXCEEDED);
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        Review review = Review.builder()
                .member(member)
                .product(orderItem.getProduct())
                .orderItem(orderItem)
                .rating(request.getRating())
                .content(request.getContent())
                .build();

        reviewRepository.save(review);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<ReviewImage> images = new ArrayList<>();
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                images.add(ReviewImage.builder()
                        .review(review)
                        .url(request.getImageUrls().get(i))
                        .sortOrder(i)
                        .build());
            }
            reviewImageRepository.saveAll(images);
        }

        return ReviewResponse.from(review, 0L, false);
    }

    @Transactional
    public void deleteReview(Long memberId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_OWNER);
        }

        review.softDelete();
    }

    @Transactional
    public ReviewLikeResponse toggleLike(Long reviewId, Long memberId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

        Optional<ReviewLike> existingLike = reviewLikeRepository.findByReviewIdAndMemberId(reviewId, memberId);

        boolean liked;
        if (existingLike.isPresent()) {
            reviewLikeRepository.delete(existingLike.get());
            liked = false;
        } else {
            reviewLikeRepository.save(ReviewLike.builder()
                    .review(review)
                    .memberId(memberId)
                    .build());
            liked = true;
        }

        long likeCount = reviewLikeRepository.countByReviewId(reviewId);

        return ReviewLikeResponse.builder()
                .liked(liked)
                .likeCount(likeCount)
                .build();
    }
}
