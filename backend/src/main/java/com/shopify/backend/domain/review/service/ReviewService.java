package com.shopify.backend.domain.review.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.order.entity.OrderItem;
import com.shopify.backend.domain.order.entity.OrderStatus;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.review.dto.ReviewCreateRequest;
import com.shopify.backend.domain.review.dto.ReviewResponse;
import com.shopify.backend.domain.review.entity.Review;
import com.shopify.backend.domain.review.entity.ReviewImage;
import com.shopify.backend.domain.review.repository.ReviewImageRepository;
import com.shopify.backend.domain.review.repository.ReviewRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final OrderItemRepository orderItemRepository;
    private final MemberRepository memberRepository;

    public Page<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        Page<Review> reviews = reviewRepository.findByProductIdAndDeletedAtIsNull(
                productId, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return reviews.map(ReviewResponse::from);
    }

    @Transactional
    public ReviewResponse createReview(Long memberId, ReviewCreateRequest request) {
        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (orderItem.getOrder().getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException(ErrorCode.ORDER_ITEM_NOT_DELIVERED);
        }

        if (reviewRepository.existsByMemberIdAndOrderItemId(memberId, request.getOrderItemId())) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
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
            List<ReviewImage> images = new java.util.ArrayList<>();
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                images.add(ReviewImage.builder()
                        .review(review)
                        .url(request.getImageUrls().get(i))
                        .sortOrder(i)
                        .build());
            }
            reviewImageRepository.saveAll(images);
        }

        return ReviewResponse.from(review);
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
}
