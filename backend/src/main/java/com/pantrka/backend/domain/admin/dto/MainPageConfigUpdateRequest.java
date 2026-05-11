package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MainPageConfigUpdateRequest {

    @Size(max = 500, message = "텍스트는 500자 이하여야 합니다.")
    private String subText;
}
