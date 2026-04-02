package com.shopify.backend.domain.auth.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "member_address")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    private String label;

    private String recipient;

    private String phone;

    private String zipcode;

    private String address;

    private String addressDetail;

    @Column(nullable = false)
    private boolean isDefault;

    @Builder
    public MemberAddress(Member member, String label, String recipient, String phone,
                         String zipcode, String address, String addressDetail, boolean isDefault) {
        this.member = member;
        this.label = label;
        this.recipient = recipient;
        this.phone = phone;
        this.zipcode = zipcode;
        this.address = address;
        this.addressDetail = addressDetail;
        this.isDefault = isDefault;
    }

    public void update(String label, String recipient, String phone, String zipcode,
                       String address, String addressDetail, Boolean isDefault) {
        if (label != null) this.label = label;
        if (recipient != null) this.recipient = recipient;
        if (phone != null) this.phone = phone;
        if (zipcode != null) this.zipcode = zipcode;
        if (address != null) this.address = address;
        if (addressDetail != null) this.addressDetail = addressDetail;
        if (isDefault != null) this.isDefault = isDefault;
    }

    public void clearDefault() {
        this.isDefault = false;
    }
}
