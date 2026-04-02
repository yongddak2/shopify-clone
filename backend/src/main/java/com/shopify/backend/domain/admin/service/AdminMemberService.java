package com.shopify.backend.domain.admin.service;

import com.shopify.backend.domain.admin.dto.AdminMemberResponse;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

    private final MemberRepository memberRepository;

    public Page<AdminMemberResponse> getMembers(int page, int size) {
        return memberRepository.findAllByDeletedAtIsNull(
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(AdminMemberResponse::from);
    }
}
