package com.pantrka.backend.domain.qna.dto;

import com.pantrka.backend.global.common.SupportCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class QnaCreateRequest {

    @NotNull(message = "카테고리는 필수입니다.")
    private SupportCategory category;

    @NotBlank(message = "제목은 필수입니다.")
    @Size(max = 200, message = "제목은 200자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    private String content;

    private boolean secret;

    private List<String> imageUrls;
}
