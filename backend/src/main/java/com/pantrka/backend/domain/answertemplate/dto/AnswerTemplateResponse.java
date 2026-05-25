package com.pantrka.backend.domain.answertemplate.dto;

import com.pantrka.backend.domain.answertemplate.entity.AnswerTemplate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AnswerTemplateResponse {

    private final Long id;
    private final String title;
    private final String content;
    private final int sortOrder;

    public static AnswerTemplateResponse from(AnswerTemplate t) {
        return AnswerTemplateResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .content(t.getContent())
                .sortOrder(t.getSortOrder())
                .build();
    }
}
