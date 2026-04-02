package com.shopify.backend.domain.auth.dto;

import lombok.Getter;

@Getter
public class AddressUpdateRequest {

    private String label;
    private String recipient;
    private String phone;
    private String zipcode;
    private String address;
    private String addressDetail;
    private Boolean defaultAddress;
}
