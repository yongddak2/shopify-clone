package com.pantrka.backend.domain.qna.service;

import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.domain.qna.dto.QnaAnswerRequest;
import com.pantrka.backend.domain.qna.dto.QnaDetailResponse;
import com.pantrka.backend.domain.qna.dto.QnaListResponse;
import com.pantrka.backend.domain.qna.entity.Qna;
import com.pantrka.backend.domain.qna.repository.QnaRepository;
import com.pantrka.backend.global.common.SupportCategory;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminQnaService {

    private final QnaRepository qnaRepository;
    private final EmailService emailService;

    public Page<QnaListResponse> getQnas(int page, int size, String keyword,
                                         SupportCategory category, Boolean answered) {
        String normalized = (keyword == null || keyword.isBlank()) ? "" : keyword.trim();
        return qnaRepository.findAdminQnas(normalized, category, answered, PageRequest.of(page, size))
                .map(q -> QnaListResponse.from(q, true, true));
    }

    public QnaDetailResponse getQna(Long id) {
        Qna qna = qnaRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        return QnaDetailResponse.from(qna);
    }

    @Transactional
    public QnaDetailResponse answerQna(Long id, QnaAnswerRequest request) {
        Qna qna = qnaRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        boolean wasAnswered = qna.isAnswered();
        qna.writeAnswer(request.getAnswer());
        // 신규 답변일 때만 이메일 발송 (수정 시 미발송, 발송 실패 격리)
        if (!wasAnswered) {
            try {
                Member m = qna.getMember();
                if (m != null && m.getEmail() != null) {
                    emailService.sendQnaAnswerEmail(m.getEmail(), m.getName(), qna.getTitle(), request.getAnswer());
                }
            } catch (Exception e) {
                log.warn("Q&A 답변 이메일 발송 호출 실패 qnaId={}", id, e);
            }
        }
        return QnaDetailResponse.from(qna);
    }

    @Transactional
    public void deleteAnswer(Long id) {
        Qna qna = qnaRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        qna.clearAnswer();
    }

    @Transactional
    public void deleteQna(Long id) {
        Qna qna = qnaRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QNA_NOT_FOUND));
        qna.markDeleted();
    }
}
