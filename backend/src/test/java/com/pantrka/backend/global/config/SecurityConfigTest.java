package com.pantrka.backend.global.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SecurityConfigTest {

    @Test
    void validatesAndNormalizesConfiguredOrigins() {
        List<String> origins = SecurityConfig.validateCorsOrigins(List.of(
                " https://shop.example.com/ ",
                "https://admin.example.com",
                "https://shop.example.com"
        ));

        assertEquals(List.of("https://shop.example.com", "https://admin.example.com"), origins);
    }

    @Test
    void rejectsWildcardsAndUrlsWithPaths() {
        assertThrows(IllegalArgumentException.class,
                () -> SecurityConfig.validateCorsOrigins(List.of("https://*.example.com")));
        assertThrows(IllegalArgumentException.class,
                () -> SecurityConfig.validateCorsOrigins(List.of("https://example.com/shop")));
        assertThrows(IllegalArgumentException.class,
                () -> SecurityConfig.validateCorsOrigins(List.of("mailto:admin@example.com")));
    }

    @Test
    void rejectsEmptyOriginLists() {
        assertThrows(IllegalArgumentException.class,
                () -> SecurityConfig.validateCorsOrigins(List.of()));
    }
}
