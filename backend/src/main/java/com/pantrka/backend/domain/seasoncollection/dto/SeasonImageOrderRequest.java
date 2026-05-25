package com.pantrka.backend.domain.seasoncollection.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SeasonImageOrderRequest {

    @NotNull(message = "id는 필수입니다.")
    private Long id;

    @NotNull(message = "sortOrder는 필수입니다.")
    private Integer sortOrder;
}
