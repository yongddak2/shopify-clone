package com.pantrka.backend.domain.answertemplate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AnswerTemplateRequest {

    @NotBlank(message = "템플릿 이름은 필수입니다.")
    @Size(max = 100, message = "템플릿 이름은 100자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "답변 내용은 필수입니다.")
    private String content;
}
