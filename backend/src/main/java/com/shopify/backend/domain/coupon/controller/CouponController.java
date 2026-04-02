package com.shopify.backend.domain.coupon.controller;

import com.shopify.backend.domain.coupon.dto.CouponApplyResponse;
import com.shopify.backend.domain.coupon.dto.MemberCouponResponse;
import com.shopify.backend.domain.coupon.service.CouponService;
import com.shopify.backend.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<MemberCouponResponse>>> getMyCoupons(Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        List<MemberCouponResponse> response = couponService.getMyCoupons(memberId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{couponId}/issue")
    public ResponseEntity<ApiResponse<MemberCouponResponse>> issueCoupon(
            Authentication authentication,
            @PathVariable Long couponId) {
        Long memberId = (Long) authentication.getPrincipal();
        MemberCouponResponse response = couponService.issueCoupon(memberId, couponId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("쿠폰이 발급되었습니다.", response));
    }

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<CouponApplyResponse>> previewCouponDiscount(
            Authentication authentication,
            @RequestParam Long memberCouponId,
            @RequestParam BigDecimal orderAmount) {
        Long memberId = (Long) authentication.getPrincipal();
        CouponApplyResponse response = couponService.previewCouponDiscount(memberId, memberCouponId, orderAmount);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
