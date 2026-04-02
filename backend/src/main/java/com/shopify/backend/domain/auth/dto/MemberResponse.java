package com.shopify.backend.domain.auth.dto;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class MemberResponse {

    private Long id;
    private String email;
    private String name;
    private String phone;
    private Role role;
    private LocalDateTime createdAt;

    public static MemberResponse from(Member member) {
        return MemberResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .phone(member.getPhone())
                .role(member.getRole())
                .createdAt(member.getCreatedAt())
                .build();
    }
}
