package com.shopify.backend.domain.auth.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.Provider;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import com.shopify.backend.infra.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PasswordResetService {

    private static final String RESET_KEY_PREFIX = "reset:";
    private static final String VERIFIED_KEY_PREFIX = "verified:";
    private static final String RESEND_COOLTIME_KEY_PREFIX = "resend-cooltime:";
    private static final long RESET_CODE_TTL_MINUTES = 3;
    private static final long VERIFIED_TTL_MINUTES = 10;
    private static final long RESEND_COOLTIME_SECONDS = 30;
    private static final String PASSWORD_PATTERN = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$";

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public void sendResetCode(String email) {
        Member member = memberRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_NOT_FOUND));

        if (member.getProvider() != Provider.LOCAL) {
            throw new BusinessException(ErrorCode.SOCIAL_LOGIN_CANNOT_RESET_PASSWORD);
        }

        if (Boolean.TRUE.equals(redisTemplate.hasKey(RESEND_COOLTIME_KEY_PREFIX + email))) {
            throw new BusinessException(ErrorCode.RESET_CODE_COOLTIME);
        }

        String code = generateCode();

        redisTemplate.opsForValue().set(
                RESET_KEY_PREFIX + email,
                code,
                RESET_CODE_TTL_MINUTES,
                TimeUnit.MINUTES
        );

        redisTemplate.opsForValue().set(
                RESEND_COOLTIME_KEY_PREFIX + email,
                "1",
                RESEND_COOLTIME_SECONDS,
                TimeUnit.SECONDS
        );

        emailService.sendPasswordResetCode(email, code);
    }

    public void verifyCode(String email, String code) {
        String storedCode = redisTemplate.opsForValue().get(RESET_KEY_PREFIX + email);

        if (storedCode == null || !storedCode.equals(code)) {
            throw new BusinessException(ErrorCode.INVALID_RESET_CODE);
        }

        redisTemplate.delete(RESET_KEY_PREFIX + email);
        redisTemplate.opsForValue().set(
                VERIFIED_KEY_PREFIX + email,
                "true",
                VERIFIED_TTL_MINUTES,
                TimeUnit.MINUTES
        );
    }

    @Transactional
    public void resetPassword(String email, String newPassword) {
        String verified = redisTemplate.opsForValue().get(VERIFIED_KEY_PREFIX + email);
        if (verified == null) {
            throw new BusinessException(ErrorCode.RESET_NOT_VERIFIED);
        }

        if (!newPassword.matches(PASSWORD_PATTERN)) {
            throw new BusinessException(ErrorCode.PASSWORD_INVALID_FORMAT);
        }

        Member member = memberRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMAIL_NOT_FOUND));

        if (passwordEncoder.matches(newPassword, member.getPassword())) {
            throw new BusinessException(ErrorCode.PASSWORD_SAME_AS_CURRENT);
        }

        member.changePassword(passwordEncoder.encode(newPassword));

        redisTemplate.delete(VERIFIED_KEY_PREFIX + email);
    }

    private String generateCode() {
        int number = secureRandom.nextInt(1_000_000);
        return String.format("%06d", number);
    }
}
