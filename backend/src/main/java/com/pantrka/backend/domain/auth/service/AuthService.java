package com.pantrka.backend.domain.auth.service;

import com.pantrka.backend.domain.auth.dto.*;
import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.domain.auth.entity.Provider;
import com.pantrka.backend.domain.auth.entity.Role;
import com.pantrka.backend.domain.auth.repository.MemberRepository;
import com.pantrka.backend.domain.coupon.entity.Coupon;
import com.pantrka.backend.domain.coupon.entity.MemberCoupon;
import com.pantrka.backend.domain.coupon.repository.CouponRepository;
import com.pantrka.backend.domain.coupon.repository.MemberCouponRepository;
import com.pantrka.backend.global.config.JwtProperties;
import com.pantrka.backend.global.config.JwtProvider;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final JwtProperties jwtProperties;
    private final StringRedisTemplate redisTemplate;
    private final CouponRepository couponRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final OAuthClient oAuthClient;

    private static final String PASSWORD_PATTERN = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$";

    @Transactional
    public MemberResponse signup(SignupRequest request) {
        Member existingMember = memberRepository.findByEmail(request.getEmail()).orElse(null);
        if (existingMember != null && existingMember.getDeletedAt() == null) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        if (!request.getPassword().matches(PASSWORD_PATTERN)) {
            throw new BusinessException(ErrorCode.PASSWORD_INVALID_FORMAT);
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        Member member;
        if (existingMember != null) {
            existingMember.reactivateLocal(
                    encodedPassword,
                    request.getName(),
                    request.getPhone(),
                    request.getBirthDate()
            );
            member = existingMember;
        } else {
            member = Member.builder()
                    .email(request.getEmail())
                    .password(encodedPassword)
                    .name(request.getName())
                    .phone(request.getPhone())
                    .birthDate(request.getBirthDate())
                    .role(Role.USER)
                    .provider(Provider.LOCAL)
                    .build();
        }

        memberRepository.save(member);
        issueWelcomeCouponSafely(member);
        return MemberResponse.from(member);
    }

    private void issueWelcomeCouponSafely(Member member) {
        try {
            LocalDateTime now = LocalDateTime.now();
            couponRepository.findFirstByIsWelcomeTrueAndEndDateAfter(now)
                    .ifPresent(coupon -> {
                        if (coupon.getValidDays() == null || coupon.getValidDays() < 1) {
                            log.warn("Welcome coupon id={} has invalid validDays, skipping issuance", coupon.getId());
                            return;
                        }
                        if (memberCouponRepository.existsByMemberIdAndCouponId(member.getId(), coupon.getId())) {
                            return;
                        }
                        coupon.issue();
                        couponRepository.save(coupon);
                        memberCouponRepository.save(MemberCoupon.builder()
                                .member(member)
                                .coupon(coupon)
                                .expiredAt(coupon.computeWelcomeExpiredAt(now))
                                .build());
                    });
        } catch (Exception e) {
            log.warn("Welcome coupon issuance failed for memberId={}", member.getId(), e);
        }
    }

    public TokenResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmailAndDeletedAtIsNull(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        return generateAndStoreTokens(member);
    }

    @Transactional
    public TokenResponse oauthLogin(Provider provider, OAuthLoginRequest request) {
        OAuthUserInfo userInfo = oAuthClient.fetchUserInfo(provider, request);

        Member member = resolveOAuthMember(provider, userInfo);

        return generateAndStoreTokens(member);
    }

    private Member resolveOAuthMember(Provider provider, OAuthUserInfo userInfo) {
        return memberRepository.findByEmailAndDeletedAtIsNull(userInfo.email())
                .orElseGet(() -> {
                    Member withdrawnMember = memberRepository.findByEmail(userInfo.email()).orElse(null);
                    if (withdrawnMember != null) {
                        withdrawnMember.reactivateOAuth(provider, userInfo.providerId(), userInfo.name());
                        memberRepository.save(withdrawnMember);
                        issueWelcomeCouponSafely(withdrawnMember);
                        return withdrawnMember;
                    }
                    return registerOAuthMember(provider, userInfo);
                });
    }

    private Member registerOAuthMember(Provider provider, OAuthUserInfo userInfo) {
        Member member = Member.builder()
                .email(userInfo.email())
                .password(null)
                .name(userInfo.name())
                .phone(null)
                .role(Role.USER)
                .provider(provider)
                .providerId(userInfo.providerId())
                .build();

        memberRepository.save(member);
        issueWelcomeCouponSafely(member);
        return member;
    }

    public TokenResponse refresh(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Long memberId = jwtProvider.getMemberIdFromToken(refreshToken);
        String storedToken = redisTemplate.opsForValue().get("refresh:" + memberId);

        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        return generateAndStoreTokens(member);
    }

    public void logout(Long memberId) {
        redisTemplate.delete("refresh:" + memberId);
    }

    private TokenResponse generateAndStoreTokens(Member member) {
        String accessToken = jwtProvider.generateAccessToken(member);
        String refreshToken = jwtProvider.generateRefreshToken(member);

        redisTemplate.opsForValue().set(
                "refresh:" + member.getId(),
                refreshToken,
                jwtProperties.getRefreshTokenExpiry(),
                TimeUnit.MILLISECONDS
        );

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenExpiry() / 1000)
                .build();
    }
}
