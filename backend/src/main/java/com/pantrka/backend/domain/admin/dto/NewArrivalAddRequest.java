package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class NewArrivalAddRequest {

    @NotEmpty(message = "추가할 상품 ID가 필요합니다.")
    private List<Long> productIds;
}
