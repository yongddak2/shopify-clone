package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class NewArrivalReplaceRequest {

    @NotNull(message = "상품 ID 목록은 null이 될 수 없습니다. (빈 배열은 허용)")
    private List<Long> productIds;
}
