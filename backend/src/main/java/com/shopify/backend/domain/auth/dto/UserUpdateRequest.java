package com.shopify.backend.domain.auth.dto;

import lombok.Getter;

@Getter
public class UserUpdateRequest {

    private String name;
    private String phone;
}
