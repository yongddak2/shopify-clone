package com.pantrka.backend.domain.faq.dto;

import com.pantrka.backend.domain.faq.entity.Faq;
import com.pantrka.backend.global.common.SupportCategory;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FaqResponse {

    private final Long id;
    private final SupportCategory category;
    private final String categoryLabel;
    private final String question;
    private final String answer;
    private final int sortOrder;

    public static FaqResponse from(Faq faq) {
        return FaqResponse.builder()
                .id(faq.getId())
                .category(faq.getCategory())
                .categoryLabel(faq.getCategory().getLabel())
                .question(faq.getQuestion())
                .answer(faq.getAnswer())
                .sortOrder(faq.getSortOrder())
                .build();
    }
}
