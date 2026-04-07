package com.shopify.backend.domain.coupon.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.coupon.dto.CouponApplyResponse;
import com.shopify.backend.domain.coupon.dto.CouponListResponse;
import com.shopify.backend.domain.coupon.dto.MemberCouponResponse;
import com.shopify.backend.domain.coupon.entity.Coupon;
import com.shopify.backend.domain.coupon.entity.MemberCoupon;
import com.shopify.backend.domain.coupon.repository.CouponRepository;
import com.shopify.backend.domain.coupon.repository.MemberCouponRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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
        return memberCouponRepository.findByMemberId(memberId).stream()
                .map(MemberCouponResponse::from)
                .toList();
    }

    public List<CouponListResponse> getAvailableCoupons(Long memberId) {
        List<Coupon> coupons = couponRepository.findAvailableCoupons(LocalDateTime.now());
        Set<Long> issuedCouponIds = memberCouponRepository.findByMemberId(memberId).stream()
                .map(mc -> mc.getCoupon().getId())
                .collect(Collectors.toSet());
        return coupons.stream()
                .map(c -> CouponListResponse.from(c, issuedCouponIds.contains(c.getId())))
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

}
