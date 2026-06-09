package com.pantrka.backend.domain.auth.controller;

import com.pantrka.backend.domain.auth.dto.*;
import com.pantrka.backend.domain.auth.entity.Provider;
import com.pantrka.backend.domain.auth.service.AuthService;
import com.pantrka.backend.global.common.ApiResponse;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<MemberResponse>> signup(@Valid @RequestBody SignupRequest request) {
        MemberResponse response = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("회원가입이 완료되었습니다.", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        authService.logout(memberId);
        return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다.", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/oauth/{provider}")
    public ResponseEntity<ApiResponse<TokenResponse>> oauthLogin(
            @PathVariable String provider,
            @Valid @RequestBody OAuthLoginRequest request) {
        TokenResponse response = authService.oauthLogin(parseProvider(provider), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Provider parseProvider(String provider) {
        try {
            Provider parsed = Provider.valueOf(provider.toUpperCase());
            if (parsed == Provider.LOCAL) {
                throw new BusinessException(ErrorCode.OAUTH_PROVIDER_NOT_SUPPORTED);
            }
            return parsed;
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.OAUTH_PROVIDER_NOT_SUPPORTED);
        }
    }
}
