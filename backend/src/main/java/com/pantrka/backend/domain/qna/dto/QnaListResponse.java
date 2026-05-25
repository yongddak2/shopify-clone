package com.pantrka.backend.domain.qna.dto;

import com.pantrka.backend.domain.qna.entity.Qna;
import com.pantrka.backend.global.common.SupportCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class QnaListResponse {

    private final Long id;
    private final SupportCategory category;
    private final String categoryLabel;
    private final String title;
    private final boolean secret;
    private final boolean answered;
    private final boolean visible; // 본인+관리자만 제목 노출, 외엔 "비밀글" 마스킹
    private final String authorMasked; // "홍*동" 형식
    private final LocalDateTime createdAt;
    private final LocalDateTime answeredAt;

    /**
     * @param visible   비밀글 제목 노출 여부 (작성자 또는 어드민 권한자만 true)
     * @param adminView 어드민 화면용 — true면 작성자 풀이름 노출, false면 항상 마스킹
     */
    public static QnaListResponse from(Qna qna, boolean visible, boolean adminView) {
        String name = qna.getMember() != null ? qna.getMember().getName() : null;
        return QnaListResponse.builder()
                .id(qna.getId())
                .category(qna.getCategory())
                .categoryLabel(qna.getCategory().getLabel())
                .title(visible ? qna.getTitle() : "비밀글입니다.")
                .secret(qna.isSecret())
                .answered(qna.isAnswered())
                .visible(visible)
                .authorMasked(adminView ? (name != null ? name : "익명") : maskName(name))
                .createdAt(qna.getCreatedAt())
                .answeredAt(qna.getAnsweredAt())
                .build();
    }

    private static String maskName(String name) {
        if (name == null || name.isEmpty()) return "익명";
        if (name.length() == 1) return name;
        if (name.length() == 2) return name.charAt(0) + "*";
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }
}
