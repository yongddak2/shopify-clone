package com.shopify.backend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class AddressCreateRequest {

    private String label;

    @NotBlank(message = "수령인은 필수입니다.")
    private String recipient;

    @NotBlank(message = "연락처는 필수입니다.")
    private String phone;

    @NotBlank(message = "우편번호는 필수입니다.")
    private String zipcode;

    @NotBlank(message = "주소는 필수입니다.")
    private String address;

    private String addressDetail;

    private Boolean defaultAddress;
}
