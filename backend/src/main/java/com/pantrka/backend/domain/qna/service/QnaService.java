package com.pantrka.backend.domain.qna.service;

import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.domain.auth.entity.Role;
import com.pantrka.backend.domain.auth.repository.MemberRepository;
import com.pantrka.backend.domain.qna.dto.QnaCreateRequest;
import com.pantrka.backend.domain.qna.dto.QnaDetailResponse;
import com.pantrka.backend.domain.qna.dto.QnaListResponse;
import com.pantrka.backend.domain.qna.dto.QnaUpdateRequest;
import com.pantrka.backend.domain.qna.entity.Qna;
import com.pantrka.backend.domain.qna.entity.QnaImage;
import com.pantrka.backend.domain.qna.repository.QnaRepository;
import com.pantrka.backend.global.common.SupportCategory;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QnaService {

    private static final int MAX_IMAGES = 3;

    private final QnaRepository qnaRepository;
    private final MemberRepository memberRepository;

    public Page<QnaListResponse> getQnas(int page, int size, SupportCategory category, Long viewerId, boolean isAdmin) {
        return qnaRepository.findPublicQnas(category, PageRequest.of(page, size))
                .map(q -> QnaListResponse.from(q, canView(q, viewerId, isAdmin), false));
    }

    public Page<QnaListResponse> getMyQnas(Long memberId, int page, int size) {
        return qnaRepository.findByMemberIdAndDeletedAtIsNullOrderByCreatedAtDesc(
                        memberId, PageRequest.of(page, size))
                // 본인 글이므로 항상 visible=true, 풀이름 표시
                .map(q -> QnaListResponse.from(q, true, true));
    }

    public QnaDetailResponse getQna(Long id, Long viewerId, boolean isAdmin) {
        Qna qna = qnaRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        if (qna.isSecret() && !canView(qna, viewerId, isAdmin)) {
            throw new BusinessException(ErrorCode.QNA_FORBIDDEN);
        }
        return QnaDetailResponse.from(qna);
    }

    @Transactional
    public QnaDetailResponse createQna(Long memberId, QnaCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        List<String> imageUrls = request.getImageUrls() == null ? List.of() : request.getImageUrls();
        if (imageUrls.size() > MAX_IMAGES) {
            throw new BusinessException(ErrorCode.QNA_IMAGE_LIMIT_EXCEEDED);
        }

        Qna qna = Qna.builder()
                .member(member)
                .category(request.getCategory())
                .title(request.getTitle())
                .content(request.getContent())
                .isSecret(request.isSecret())
                .build();
        qnaRepository.save(qna);

        for (int i = 0; i < imageUrls.size(); i++) {
            qna.addImage(QnaImage.builder()
                    .qna(qna)
                    .url(imageUrls.get(i))
                    .sortOrder(i)
                    .build());
        }
        return QnaDetailResponse.from(qna);
    }

    @Transactional
    public QnaDetailResponse updateQna(Long id, Long memberId, QnaUpdateRequest request) {
        Qna qna = qnaRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        if (!qna.isOwner(memberId)) {
            throw new BusinessException(ErrorCode.QNA_FORBIDDEN);
        }
        if (qna.isAnswered()) {
            throw new BusinessException(ErrorCode.QNA_ANSWERED_CANNOT_MODIFY);
        }
        qna.update(request.getCategory(), request.getTitle(), request.getContent(), request.isSecret());
        return QnaDetailResponse.from(qna);
    }

    @Transactional
    public void deleteQna(Long id, Long memberId, boolean isAdmin) {
        Qna qna = qnaRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        if (!isAdmin && !qna.isOwner(memberId)) {
            throw new BusinessException(ErrorCode.QNA_FORBIDDEN);
        }
        qna.markDeleted();
    }

    private boolean canView(Qna qna, Long viewerId, boolean isAdmin) {
        if (!qna.isSecret()) return true;
        if (isAdmin) return true;
        return viewerId != null && qna.isOwner(viewerId);
    }

    // 컨트롤러에서 Authentication으로 isAdmin 판별용 헬퍼 (Member role lookup)
    @Transactional(readOnly = true)
    public boolean isAdminMember(Long memberId) {
        if (memberId == null) return false;
        return memberRepository.findById(memberId)
                .map(m -> m.getRole() == Role.ADMIN)
                .orElse(false);
    }
}
