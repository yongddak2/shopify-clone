package com.shopify.backend.domain.auth.controller;

import com.shopify.backend.domain.auth.dto.PasswordResetRequest;
import com.shopify.backend.domain.auth.dto.PasswordResetSendRequest;
import com.shopify.backend.domain.auth.dto.PasswordResetVerifyRequest;
import com.shopify.backend.domain.auth.service.PasswordResetService;
import com.shopify.backend.global.common.ApiResponse;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Void>> send(@Valid @RequestBody PasswordResetSendRequest request) {
        passwordResetService.sendResetCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("인증번호가 발송되었습니다.", null));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> verify(@Valid @RequestBody PasswordResetVerifyRequest request) {
        passwordResetService.verifyCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("인증이 완료되었습니다.", null));
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<Void>> reset(@Valid @RequestBody PasswordResetRequest request) {
        if (!request.getNewPassword().equals(request.getNewPasswordConfirm())) {
            throw new BusinessException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }
        passwordResetService.resetPassword(request.getEmail(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("비밀번호가 변경되었습니다.", null));
    }
}
