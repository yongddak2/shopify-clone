package com.pantrka.backend.global.config;

import com.pantrka.backend.global.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URI;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        // Public - Products, Categories & Banners
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**", "/api/categories", "/api/banners", "/api/main-page-config").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/images/**").permitAll()

                        // Public - Season Collections (PNTK)
                        .requestMatchers(HttpMethod.GET, "/api/season-collections", "/api/season-collections/**").permitAll()

                        // Public - Notices & FAQ
                        .requestMatchers(HttpMethod.GET, "/api/notices", "/api/notices/**", "/api/faqs").permitAll()

                        // Q&A - /me는 인증 필수 (더 구체적인 매처를 먼저 선언)
                        .requestMatchers(HttpMethod.GET, "/api/qnas/me").authenticated()
                        // Public - Q&A 목록·상세 조회 (작성/수정/삭제/이미지업로드는 인증 필요)
                        .requestMatchers(HttpMethod.GET, "/api/qnas", "/api/qnas/**").permitAll()

                        // Public - Auth
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/signup",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/oauth/**",
                                "/api/auth/password-reset/**").permitAll()

                        // NICE Payments redirects authentication results as a form POST.
                        .requestMatchers(HttpMethod.POST, "/api/payments/nice/callback").permitAll()

                        // Public - Health & Docs
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // Admin only
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${APP_CORS_ALLOWED_ORIGINS:http://localhost:3000}") List<String> configuredOrigins) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(validateCorsOrigins(configuredOrigins));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    static List<String> validateCorsOrigins(List<String> configuredOrigins) {
        if (configuredOrigins == null || configuredOrigins.isEmpty()) {
            throw new IllegalArgumentException("APP_CORS_ALLOWED_ORIGINS must contain at least one origin");
        }

        return configuredOrigins.stream()
                .map(String::trim)
                .map(SecurityConfig::validateCorsOrigin)
                .distinct()
                .toList();
    }

    private static String validateCorsOrigin(String configuredOrigin) {
        if (configuredOrigin.isEmpty() || configuredOrigin.contains("*")) {
            throw new IllegalArgumentException("CORS origins must be explicit HTTP(S) origins");
        }

        URI origin;
        try {
            origin = URI.create(configuredOrigin);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid CORS origin: " + configuredOrigin, exception);
        }

        boolean validScheme = "http".equalsIgnoreCase(origin.getScheme())
                || "https".equalsIgnoreCase(origin.getScheme());
        boolean rootPath = origin.getPath() == null
                || origin.getPath().isEmpty()
                || "/".equals(origin.getPath());
        if (!validScheme || origin.getHost() == null || origin.getUserInfo() != null
                || !rootPath || origin.getQuery() != null || origin.getFragment() != null) {
            throw new IllegalArgumentException("CORS value must be an HTTP(S) origin without path: " + configuredOrigin);
        }

        return origin.getScheme().toLowerCase() + "://" + origin.getRawAuthority();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
