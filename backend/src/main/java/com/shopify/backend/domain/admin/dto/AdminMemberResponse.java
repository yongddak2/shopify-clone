package com.shopify.backend.domain.admin.dto;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.Provider;
import com.shopify.backend.domain.auth.entity.Role;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AdminMemberResponse {

    private final Long id;
    private final String email;
    private final String name;
    private final String phone;
    private final Role role;
    private final Provider provider;
    private final LocalDateTime createdAt;
    private final LocalDateTime deletedAt;

    public static AdminMemberResponse from(Member member) {
        return AdminMemberResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .phone(member.getPhone())
                .role(member.getRole())
                .provider(member.getProvider())
                .createdAt(member.getCreatedAt())
                .deletedAt(member.getDeletedAt())
                .build();
    }
}
