package com.pantrka.backend.domain.seasoncollection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SeasonCollectionUpdateRequest {

    @NotBlank(message = "시즌 이름은 필수입니다.")
    @Size(max = 50, message = "시즌 이름은 50자 이하여야 합니다.")
    private String name;
}
