package com.shopify.backend.domain.admin.service;

import com.shopify.backend.domain.coupon.dto.CouponCreateRequest;
import com.shopify.backend.domain.coupon.dto.CouponResponse;
import com.shopify.backend.domain.coupon.dto.CouponUpdateRequest;
import com.shopify.backend.domain.coupon.entity.Coupon;
import com.shopify.backend.domain.coupon.repository.CouponRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminCouponService {

    private final CouponRepository couponRepository;

    public Page<CouponResponse> getCoupons(int page, int size) {
        return couponRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")))
                .map(CouponResponse::from);
    }

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

    @Transactional
    public CouponResponse updateCoupon(Long couponId, CouponUpdateRequest request) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_NOT_FOUND));

        if (request.getTotalQuantity() < coupon.getIssuedQuantity()) {
            throw new BusinessException(ErrorCode.COUPON_TOTAL_QUANTITY_INVALID);
        }

        coupon.update(
                request.getName(),
                request.getTotalQuantity(),
                request.getStartDate(),
                request.getEndDate()
        );

        return CouponResponse.from(coupon);
    }

    @Transactional
    public void deleteCoupon(Long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_NOT_FOUND));

        if (coupon.getIssuedQuantity() > 0) {
            throw new BusinessException(ErrorCode.COUPON_HAS_ISSUED_MEMBERS);
        }

        couponRepository.delete(coupon);
    }
}
