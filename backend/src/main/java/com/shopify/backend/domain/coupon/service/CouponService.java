package com.shopify.backend.domain.coupon.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.coupon.dto.CouponApplyResponse;
import com.shopify.backend.domain.coupon.dto.CouponCreateRequest;
import com.shopify.backend.domain.coupon.dto.CouponResponse;
import com.shopify.backend.domain.coupon.dto.MemberCouponResponse;
import com.shopify.backend.domain.coupon.entity.Coupon;
import com.shopify.backend.domain.coupon.entity.MemberCoupon;
import com.shopify.backend.domain.coupon.repository.CouponRepository;
import com.shopify.backend.domain.coupon.repository.MemberCouponRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CouponService {

    private final CouponRepository couponRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public MemberCouponResponse issueCoupon(Long memberId, Long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_NOT_FOUND));

        if (!coupon.isValid()) {
            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(coupon.getStartDate()) || now.isAfter(coupon.getEndDate())) {
                throw new BusinessException(ErrorCode.COUPON_EXPIRED);
            }
            throw new BusinessException(ErrorCode.COUPON_OUT_OF_STOCK);
        }

        if (memberCouponRepository.existsByMemberIdAndCouponId(memberId, couponId)) {
            throw new BusinessException(ErrorCode.COUPON_ALREADY_ISSUED);
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        coupon.issue();

        MemberCoupon memberCoupon = MemberCoupon.builder()
                .member(member)
                .coupon(coupon)
                .expiredAt(coupon.getEndDate())
                .build();

        memberCouponRepository.save(memberCoupon);
        return MemberCouponResponse.from(memberCoupon);
    }

    public List<MemberCouponResponse> getMyCoupons(Long memberId) {
        return memberCouponRepository.findByMemberIdAndUsedAtIsNull(memberId).stream()
                .map(MemberCouponResponse::from)
                .toList();
    }

    public CouponApplyResponse previewCouponDiscount(Long memberId, Long memberCouponId, BigDecimal orderAmount) {
        MemberCoupon memberCoupon = memberCouponRepository.findById(memberCouponId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_COUPON_NOT_FOUND));

        if (!memberCoupon.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.MEMBER_COUPON_NOT_FOUND);
        }

        if (!memberCoupon.isUsable()) {
            throw new BusinessException(ErrorCode.COUPON_NOT_USABLE);
        }

        Coupon coupon = memberCoupon.getCoupon();
        if (coupon.getMinOrderAmount() != null && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new BusinessException(ErrorCode.COUPON_MIN_ORDER_NOT_MET);
        }

        BigDecimal discountAmount = coupon.calculateDiscount(orderAmount);
        BigDecimal finalAmount = orderAmount.subtract(discountAmount);

        return CouponApplyResponse.builder()
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .build();
    }

    @Transactional
    public void useCoupon(Long memberCouponId) {
        MemberCoupon memberCoupon = memberCouponRepository.findById(memberCouponId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_COUPON_NOT_FOUND));
        memberCoupon.use();
    }

    // ── Admin ──

    @Transactional
    public CouponResponse createCoupon(CouponCreateRequest request) {
        Coupon coupon = Coupon.builder()
                .name(request.getName())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .totalQuantity(request.getTotalQuantity())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        couponRepository.save(coupon);
        return CouponResponse.from(coupon);
    }

    public Page<CouponResponse> getAllCoupons(int page, int size) {
        return couponRepository.findAll(PageRequest.of(page, size))
                .map(CouponResponse::from);
    }
}
