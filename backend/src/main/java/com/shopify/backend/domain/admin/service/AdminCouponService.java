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
        boolean welcome = Boolean.TRUE.equals(request.getIsWelcome());
        Integer validDays = welcome ? requireValidDays(request.getValidDays()) : null;
        Integer totalQuantity = welcome ? null : requireTotalQuantity(request.getTotalQuantity());

        if (welcome) {
            unmarkExistingWelcomeCoupons(null);
        }

        Coupon coupon = Coupon.builder()
                .name(request.getName())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .totalQuantity(totalQuantity)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isWelcome(welcome)
                .validDays(validDays)
                .build();

        couponRepository.save(coupon);
        return CouponResponse.from(coupon);
    }

    @Transactional
    public CouponResponse updateCoupon(Long couponId, CouponUpdateRequest request) {
        Coupon coupon = couponRepository.findById(couponId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COUPON_NOT_FOUND));

        boolean welcomeAfter = request.getIsWelcome() != null
                ? request.getIsWelcome()
                : coupon.isWelcome();
        Integer validDaysAfter = welcomeAfter
                ? requireValidDays(request.getValidDays() != null ? request.getValidDays() : coupon.getValidDays())
                : null;

        Integer totalQuantity;
        if (welcomeAfter) {
            totalQuantity = null;
        } else {
            totalQuantity = requireTotalQuantity(request.getTotalQuantity());
            if (totalQuantity < coupon.getIssuedQuantity()) {
                throw new BusinessException(ErrorCode.COUPON_TOTAL_QUANTITY_INVALID);
            }
        }

        coupon.update(
                request.getName(),
                totalQuantity,
                request.getStartDate(),
                request.getEndDate()
        );

        if (welcomeAfter) {
            unmarkExistingWelcomeCoupons(coupon.getId());
            coupon.markAsWelcome(validDaysAfter);
        } else if (request.getIsWelcome() != null) {
            coupon.unmarkAsWelcome();
        }

        return CouponResponse.from(coupon);
    }

    private int requireTotalQuantity(Integer value) {
        if (value == null || value < 1) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        return value;
    }

    private int requireValidDays(Integer value) {
        if (value == null || value < 1) {
            throw new BusinessException(ErrorCode.WELCOME_VALID_DAYS_REQUIRED);
        }
        return value;
    }

    private void unmarkExistingWelcomeCoupons(Long excludeId) {
        couponRepository.findByIsWelcomeTrue().forEach(c -> {
            if (excludeId == null || !c.getId().equals(excludeId)) {
                c.unmarkAsWelcome();
            }
        });
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
