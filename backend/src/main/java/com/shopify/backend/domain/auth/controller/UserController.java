package com.shopify.backend.domain.auth.controller;

import com.shopify.backend.domain.auth.dto.*;
import com.shopify.backend.domain.auth.service.UserService;
import com.shopify.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "회원 API")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        UserResponse response = userService.getMe(memberId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            Authentication authentication,
            @RequestBody UserUpdateRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        UserResponse response = userService.updateMe(memberId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordChangeRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        userService.changePassword(memberId, request);
        return ResponseEntity.ok(ApiResponse.success("비밀번호가 변경되었습니다.", null));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> withdraw(Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        userService.withdraw(memberId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        List<AddressResponse> response = userService.getAddresses(memberId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/me/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            Authentication authentication,
            @Valid @RequestBody AddressCreateRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        AddressResponse response = userService.addAddress(memberId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PatchMapping("/me/addresses/{id}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody AddressUpdateRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        AddressResponse response = userService.updateAddress(memberId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/me/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(
            Authentication authentication,
            @PathVariable Long id) {
        Long memberId = (Long) authentication.getPrincipal();
        userService.deleteAddress(memberId, id);
        return ResponseEntity.noContent().build();
    }
}
