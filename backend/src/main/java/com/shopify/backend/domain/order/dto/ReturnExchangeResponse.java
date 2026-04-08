package com.shopify.backend.domain.order.dto;

import com.shopify.backend.domain.order.entity.ReasonCategory;
import com.shopify.backend.domain.order.entity.ReasonDetail;
import com.shopify.backend.domain.order.entity.ReasonType;
import com.shopify.backend.domain.order.entity.RequestStatus;
import com.shopify.backend.domain.order.entity.ReturnExchangeRequest;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ReturnExchangeResponse {

    private final Long id;
    private final Long orderId;
    private final String orderNumber;
    private final ReasonType type;
    private final ReasonDetail reasonDetail;
    private final String reasonDetailLabel;
    private final ReasonCategory reasonCategory;
    private final String reasonText;
    private final RequestStatus status;
    private final String adminMemo;
    private final List<String> imageUrls;
    private final Long desiredOptionValueId;
    private final String desiredOptionValue;
    private final LocalDateTime createdAt;

    public static ReturnExchangeResponse from(ReturnExchangeRequest request) {
        List<String> imageUrls = request.getImages().stream()
                .map(img -> img.getUrl())
                .toList();

        Long desiredOptionValueId = null;
        String desiredOptionValueLabel = null;
        if (request.getDesiredOptionValue() != null) {
            desiredOptionValueId = request.getDesiredOptionValue().getId();
            desiredOptionValueLabel = request.getDesiredOptionValue().getValue();
        }

        return ReturnExchangeResponse.builder()
                .id(request.getId())
                .orderId(request.getOrder().getId())
                .orderNumber(request.getOrder().getOrderNumber())
                .type(request.getType())
                .reasonDetail(request.getReasonDetail())
                .reasonDetailLabel(request.getReasonDetail().getLabel())
                .reasonCategory(request.getReasonCategory())
                .reasonText(request.getReasonText())
                .status(request.getStatus())
                .adminMemo(request.getAdminMemo())
                .imageUrls(imageUrls)
                .desiredOptionValueId(desiredOptionValueId)
                .desiredOptionValue(desiredOptionValueLabel)
                .createdAt(request.getCreatedAt())
                .build();
    }
}
