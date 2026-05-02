package com.shopify.backend.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopify.backend.global.common.ApiResponse;
import com.shopify.backend.global.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    public static final String AUTH_ERROR_MESSAGE_ATTR = "auth.error.message";

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        Object override = request.getAttribute(AUTH_ERROR_MESSAGE_ATTR);
        String message = override instanceof String s && !s.isBlank()
                ? s
                : ErrorCode.UNAUTHORIZED.getMessage();

        response.setStatus(ErrorCode.UNAUTHORIZED.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        MAPPER.writeValue(response.getWriter(), ApiResponse.error(message));
    }
}
