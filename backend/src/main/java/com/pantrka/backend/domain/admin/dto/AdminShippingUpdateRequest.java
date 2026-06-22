package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class AdminShippingUpdateRequest {

    @NotBlank(message = "배송사는 필수입니다.")
    @Size(max = 50, message = "배송사는 50자 이하여야 합니다.")
    private String carrier;

    @NotBlank(message = "운송장 번호는 필수입니다.")
    @Size(max = 100, message = "운송장 번호는 100자 이하여야 합니다.")
    private String trackingNumber;
}
