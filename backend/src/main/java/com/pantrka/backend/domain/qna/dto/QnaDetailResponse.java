package com.pantrka.backend.domain.qna.dto;

import com.pantrka.backend.domain.qna.entity.Qna;
import com.pantrka.backend.global.common.SupportCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class QnaDetailResponse {

    private final Long id;
    private final SupportCategory category;
    private final String categoryLabel;
    private final String title;
    private final String content;
    private final boolean secret;
    private final String answer;
    private final LocalDateTime answeredAt;
    private final boolean answered;
    private final Long authorId;
    private final String authorName;
    private final List<String> imageUrls;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    public static QnaDetailResponse from(Qna qna) {
        return QnaDetailResponse.builder()
                .id(qna.getId())
                .category(qna.getCategory())
                .categoryLabel(qna.getCategory().getLabel())
                .title(qna.getTitle())
                .content(qna.getContent())
                .secret(qna.isSecret())
                .answer(qna.getAnswer())
                .answeredAt(qna.getAnsweredAt())
                .answered(qna.isAnswered())
                .authorId(qna.getMember() != null ? qna.getMember().getId() : null)
                .authorName(qna.getMember() != null ? qna.getMember().getName() : null)
                .imageUrls(qna.getImages().stream()
                        .sorted((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                        .map(img -> img.getUrl())
                        .toList())
                .createdAt(qna.getCreatedAt())
                .updatedAt(qna.getUpdatedAt())
                .build();
    }
}
