package com.shopify.backend.domain.auth.service;

import com.shopify.backend.domain.auth.dto.*;
import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.MemberAddress;
import com.shopify.backend.domain.auth.repository.MemberAddressRepository;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final MemberRepository memberRepository;
    private final MemberAddressRepository memberAddressRepository;

    public UserResponse getMe(Long memberId) {
        Member member = findMemberOrThrow(memberId);
        return UserResponse.from(member);
    }

    @Transactional
    public UserResponse updateMe(Long memberId, UserUpdateRequest request) {
        Member member = findMemberOrThrow(memberId);
        member.update(request.getName(), request.getPhone());
        return UserResponse.from(member);
    }

    @Transactional
    public void withdraw(Long memberId) {
        Member member = findMemberOrThrow(memberId);
        member.withdraw();
    }

    public List<AddressResponse> getAddresses(Long memberId) {
        return memberAddressRepository.findByMemberId(memberId).stream()
                .map(AddressResponse::from)
                .toList();
    }

    @Transactional
    public AddressResponse addAddress(Long memberId, AddressCreateRequest request) {
        Member member = findMemberOrThrow(memberId);

        boolean isDefault = Boolean.TRUE.equals(request.getDefaultAddress());

        if (isDefault) {
            clearDefaultAddresses(memberId);
        }

        MemberAddress address = MemberAddress.builder()
                .member(member)
                .label(request.getLabel())
                .recipient(request.getRecipient())
                .phone(request.getPhone())
                .zipcode(request.getZipcode())
                .address(request.getAddress())
                .addressDetail(request.getAddressDetail())
                .isDefault(isDefault)
                .build();

        memberAddressRepository.save(address);
        return AddressResponse.from(address);
    }

    @Transactional
    public AddressResponse updateAddress(Long memberId, Long addressId, AddressUpdateRequest request) {
        MemberAddress address = memberAddressRepository.findById(addressId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));

        if (!address.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.ADDRESS_FORBIDDEN);
        }

        if (Boolean.TRUE.equals(request.getDefaultAddress())) {
            clearDefaultAddresses(memberId);
        }

        address.update(
                request.getLabel(),
                request.getRecipient(),
                request.getPhone(),
                request.getZipcode(),
                request.getAddress(),
                request.getAddressDetail(),
                request.getDefaultAddress()
        );

        return AddressResponse.from(address);
    }

    @Transactional
    public void deleteAddress(Long memberId, Long addressId) {
        MemberAddress address = memberAddressRepository.findById(addressId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));

        if (!address.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.ADDRESS_FORBIDDEN);
        }

        memberAddressRepository.delete(address);
    }

    private Member findMemberOrThrow(Long memberId) {
        return memberRepository.findByIdAndDeletedAtIsNull(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
    }

    private void clearDefaultAddresses(Long memberId) {
        memberAddressRepository.findByMemberId(memberId).stream()
                .filter(MemberAddress::isDefault)
                .forEach(MemberAddress::clearDefault);
    }
}
