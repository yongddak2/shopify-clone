package com.shopify.backend.domain.admin.dto;

import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class AdminMemberMemoUpdateRequest {

    @Size(max = 500)
    private String adminMemo;
}
