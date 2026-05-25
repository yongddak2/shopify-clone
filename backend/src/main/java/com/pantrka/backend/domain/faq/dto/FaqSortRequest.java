package com.pantrka.backend.domain.faq.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class FaqSortRequest {

    @NotEmpty(message = "정렬할 FAQ 목록은 비어 있을 수 없습니다.")
    private List<Item> items;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Item {
        @NotNull(message = "FAQ id는 필수입니다.")
        private Long id;

        @NotNull(message = "sortOrder는 필수입니다.")
        private Integer sortOrder;
    }
}
