package com.shopify.backend.domain.auth.dto;

import com.shopify.backend.domain.auth.entity.MemberAddress;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AddressResponse {

    private final Long id;
    private final String label;
    private final String recipient;
    private final String phone;
    private final String zipcode;
    private final String address;
    private final String addressDetail;
    private final boolean defaultAddress;

    public static AddressResponse from(MemberAddress memberAddress) {
        return AddressResponse.builder()
                .id(memberAddress.getId())
                .label(memberAddress.getLabel())
                .recipient(memberAddress.getRecipient())
                .phone(memberAddress.getPhone())
                .zipcode(memberAddress.getZipcode())
                .address(memberAddress.getAddress())
                .addressDetail(memberAddress.getAddressDetail())
                .defaultAddress(memberAddress.isDefault())
                .build();
    }
}
