package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class NewArrivalReorderRequest {

    @NotEmpty(message = "정렬할 ID 목록이 필요합니다.")
    private List<Long> orderedIds;
}
