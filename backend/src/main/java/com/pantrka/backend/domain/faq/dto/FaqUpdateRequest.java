package com.pantrka.backend.domain.faq.dto;

import com.pantrka.backend.global.common.SupportCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FaqUpdateRequest {

    @NotNull(message = "카테고리는 필수입니다.")
    private SupportCategory category;

    @NotBlank(message = "질문은 필수입니다.")
    @Size(max = 300, message = "질문은 300자 이하여야 합니다.")
    private String question;

    @NotBlank(message = "답변은 필수입니다.")
    private String answer;
}
