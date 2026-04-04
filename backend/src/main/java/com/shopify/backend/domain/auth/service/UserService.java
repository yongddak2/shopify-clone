package com.shopify.backend.domain.auth.service;

import com.shopify.backend.domain.auth.dto.*;
import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.MemberAddress;
import com.shopify.backend.domain.auth.entity.Provider;
import com.shopify.backend.domain.auth.repository.MemberAddressRepository;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final MemberRepository memberRepository;
    private final MemberAddressRepository memberAddressRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String PASSWORD_PATTERN = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$";

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
    public void changePassword(Long memberId, PasswordChangeRequest request) {
        Member member = findMemberOrThrow(memberId);

        if (member.getProvider() != Provider.LOCAL) {
            throw new BusinessException(ErrorCode.SOCIAL_LOGIN_PASSWORD_CHANGE);
        }

        if (member.getPasswordChangedAt() != null
                && member.getPasswordChangedAt().plusDays(30).isAfter(LocalDateTime.now())) {
            String nextDate = member.getPasswordChangedAt().plusDays(30)
                    .format(DateTimeFormatter.ofPattern("yyyy.MM.dd"));
            throw new BusinessException(ErrorCode.PASSWORD_CHANGE_TOO_FREQUENT,
                    "비밀번호는 30일에 한 번만 변경할 수 있습니다. 다음 변경 가능일: " + nextDate);
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), member.getPassword())) {
            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
        }

        if (!request.getNewPassword().equals(request.getNewPasswordConfirm())) {
            throw new BusinessException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (passwordEncoder.matches(request.getNewPassword(), member.getPassword())) {
            throw new BusinessException(ErrorCode.PASSWORD_SAME_AS_CURRENT);
        }

        if (!request.getNewPassword().matches(PASSWORD_PATTERN)) {
            throw new BusinessException(ErrorCode.PASSWORD_INVALID_FORMAT);
        }

        member.changePassword(passwordEncoder.encode(request.getNewPassword()));
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
