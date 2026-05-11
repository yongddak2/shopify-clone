package com.pantrka.backend.domain.order.dto;

import com.pantrka.backend.domain.order.entity.ReasonDetail;
import com.pantrka.backend.domain.order.entity.ReasonType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ReturnExchangeCreateRequest {

    @NotNull
    private ReasonType type;

    @NotNull
    private ReasonDetail reasonDetail;

    @NotBlank
    @Size(max = 500)
    private String reasonText;

    private List<String> imageUrls;

    private Long desiredOptionValueId;
}
