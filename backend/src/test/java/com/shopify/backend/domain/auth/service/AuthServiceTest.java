package com.shopify.backend.domain.auth.service;

import com.shopify.backend.domain.auth.dto.LoginRequest;
import com.shopify.backend.domain.auth.dto.SignupRequest;
import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.Provider;
import com.shopify.backend.domain.auth.entity.Role;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.global.config.JwtProperties;
import com.shopify.backend.global.config.JwtProvider;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthService authService;

    private Member member;

    @BeforeEach
    void setUp() {
        member = Member.builder()
                .email("test@test.com")
                .password("encodedPassword")
                .name("테스트")
                .phone("010-1234-5678")
                .role(Role.USER)
                .provider(Provider.LOCAL)
                .build();
        ReflectionTestUtils.setField(member, "id", 1L);
    }

    private SignupRequest createSignupRequest() {
        SignupRequest request = new SignupRequest();
        ReflectionTestUtils.setField(request, "email", "test@test.com");
        ReflectionTestUtils.setField(request, "password", "Password1!");
        ReflectionTestUtils.setField(request, "name", "테스트");
        ReflectionTestUtils.setField(request, "phone", "010-1234-5678");
        return request;
    }

    private LoginRequest createLoginRequest(String email, String password) {
        LoginRequest request = new LoginRequest();
        ReflectionTestUtils.setField(request, "email", email);
        ReflectionTestUtils.setField(request, "password", password);
        return request;
    }

    @Test
    @DisplayName("회원가입_성공")
    void 회원가입_성공() {
        // given
        SignupRequest request = createSignupRequest();

        given(memberRepository.existsByEmail("test@test.com")).willReturn(false);
        given(passwordEncoder.encode("Password1!")).willReturn("encodedPassword");
        given(memberRepository.save(any(Member.class))).willAnswer(invocation -> {
            Member saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 1L);
            return saved;
        });

        // when
        var response = authService.signup(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("test@test.com");
        assertThat(response.getName()).isEqualTo("테스트");
        verify(memberRepository).save(any(Member.class));
        verify(passwordEncoder).encode("Password1!");
    }

    @Test
    @DisplayName("중복_이메일_회원가입_예외")
    void 중복_이메일_회원가입_예외() {
        // given
        SignupRequest request = createSignupRequest();
        given(memberRepository.existsByEmail("test@test.com")).willReturn(true);

        // when & then
        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);
    }

    @Test
    @DisplayName("로그인_성공")
    void 로그인_성공() {
        // given
        LoginRequest request = createLoginRequest("test@test.com", "password123");

        given(memberRepository.findByEmailAndDeletedAtIsNull("test@test.com")).willReturn(Optional.of(member));
        given(passwordEncoder.matches("password123", "encodedPassword")).willReturn(true);
        given(jwtProvider.generateAccessToken(member)).willReturn("access-token");
        given(jwtProvider.generateRefreshToken(member)).willReturn("refresh-token");
        given(jwtProperties.getAccessTokenExpiry()).willReturn(3600000L);
        given(jwtProperties.getRefreshTokenExpiry()).willReturn(604800000L);
        given(redisTemplate.opsForValue()).willReturn(valueOperations);

        // when
        var response = authService.login(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
    }

    @Test
    @DisplayName("로그인_실패_이메일_없음")
    void 로그인_실패_이메일_없음() {
        // given
        LoginRequest request = createLoginRequest("notfound@test.com", "password123");
        given(memberRepository.findByEmailAndDeletedAtIsNull("notfound@test.com")).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.MEMBER_NOT_FOUND);
    }

    @Test
    @DisplayName("로그인_실패_비밀번호_불일치")
    void 로그인_실패_비밀번호_불일치() {
        // given
        LoginRequest request = createLoginRequest("test@test.com", "wrongPassword");

        given(memberRepository.findByEmailAndDeletedAtIsNull("test@test.com")).willReturn(Optional.of(member));
        given(passwordEncoder.matches("wrongPassword", "encodedPassword")).willReturn(false);

        // when & then
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_PASSWORD);
    }
}
