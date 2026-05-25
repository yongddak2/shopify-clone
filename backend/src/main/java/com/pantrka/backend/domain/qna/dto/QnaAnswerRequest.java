package com.pantrka.backend.domain.qna.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class QnaAnswerRequest {

    @NotBlank(message = "답변은 필수입니다.")
    private String answer;
}
