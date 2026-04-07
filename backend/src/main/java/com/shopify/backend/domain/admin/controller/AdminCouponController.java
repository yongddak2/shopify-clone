package com.shopify.backend.domain.admin.controller;

import com.shopify.backend.domain.admin.service.AdminCouponService;
import com.shopify.backend.domain.coupon.dto.CouponCreateRequest;
import com.shopify.backend.domain.coupon.dto.CouponResponse;
import com.shopify.backend.domain.coupon.dto.CouponUpdateRequest;
import com.shopify.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
@Tag(name = "Admin Coupon", description = "관리자 쿠폰 관리 API")
public class AdminCouponController {

    private final AdminCouponService adminCouponService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CouponResponse>>> getCoupons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<CouponResponse> response = adminCouponService.getCoupons(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(
            @Valid @RequestBody CouponCreateRequest request) {
        CouponResponse response = adminCouponService.createCoupon(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("쿠폰이 생성되었습니다.", response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(
            @PathVariable Long id,
            @Valid @RequestBody CouponUpdateRequest request) {
        CouponResponse response = adminCouponService.updateCoupon(id, request);
        return ResponseEntity.ok(ApiResponse.success("쿠폰이 수정되었습니다.", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        adminCouponService.deleteCoupon(id);
        return ResponseEntity.noContent().build();
    }
}
