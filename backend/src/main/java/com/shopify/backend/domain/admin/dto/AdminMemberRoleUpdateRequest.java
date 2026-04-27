package com.shopify.backend.domain.admin.dto;

import com.shopify.backend.domain.auth.entity.Role;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class AdminMemberRoleUpdateRequest {

    @NotNull
    private Role role;
}
