package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class InstagramSectionUpdateRequest {

    @Size(max = 100, message = "Instagram 계정명은 100자 이하여야 합니다.")
    private String handle;

    @NotNull
    @Size(min = 3, max = 3, message = "Instagram 이미지는 정확히 3개여야 합니다.")
    private List<@Valid InstagramItemRequest> items;
}
