package com.shopify.backend.domain.order.service;

import com.shopify.backend.domain.order.dto.ReturnExchangeCreateRequest;
import com.shopify.backend.domain.order.dto.ReturnExchangeResponse;
import com.shopify.backend.domain.order.entity.Order;
import com.shopify.backend.domain.order.entity.OrderItem;
import com.shopify.backend.domain.order.entity.OrderStatus;
import com.shopify.backend.domain.order.entity.ReasonType;
import com.shopify.backend.domain.order.entity.RequestStatus;
import com.shopify.backend.domain.order.entity.ReturnExchangeImage;
import com.shopify.backend.domain.order.entity.ReturnExchangeRequest;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.order.repository.OrderRepository;
import com.shopify.backend.domain.order.repository.ReturnExchangeRequestRepository;
import com.shopify.backend.domain.product.entity.ProductOptionValue;
import com.shopify.backend.domain.product.repository.ProductOptionValueRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReturnExchangeService {

    private final ReturnExchangeRequestRepository requestRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductOptionValueRepository productOptionValueRepository;

    private static final List<RequestStatus> ACTIVE_STATUSES =
            List.of(RequestStatus.REQUESTED, RequestStatus.APPROVED);

    @Transactional
    public ReturnExchangeResponse createRequest(Long memberId, Long orderId, ReturnExchangeCreateRequest req) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.ORDER_FORBIDDEN);
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException(ErrorCode.ORDER_NOT_DELIVERED);
        }

        if (order.getConfirmedAt() != null) {
            throw new BusinessException(ErrorCode.CONFIRMED_ORDER_CANNOT_REQUEST);
        }

        if (requestRepository.existsByOrderIdAndStatusIn(orderId, ACTIVE_STATUSES)) {
            throw new BusinessException(ErrorCode.DUPLICATE_RETURN_REQUEST);
        }

        if (req.getImageUrls() != null && req.getImageUrls().size() > 3) {
            throw new BusinessException(ErrorCode.TOO_MANY_IMAGES);
        }

        ProductOptionValue desiredOption = null;
        if (req.getType() == ReasonType.EXCHANGE) {
            if (req.getDesiredOptionValueId() == null) {
                throw new BusinessException(ErrorCode.EXCHANGE_OPTION_REQUIRED);
            }
            desiredOption = productOptionValueRepository.findById(req.getDesiredOptionValueId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_OPTION_NOT_FOUND));
        }

        ReturnExchangeRequest entity = ReturnExchangeRequest.builder()
                .order(order)
                .type(req.getType())
                .reasonCategory(req.getReasonDetail().getCategory())
                .reasonDetail(req.getReasonDetail())
                .reasonText(req.getReasonText())
                .status(RequestStatus.REQUESTED)
                .desiredOptionValue(desiredOption)
                .build();

        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            int order2 = 0;
            for (String url : req.getImageUrls()) {
                ReturnExchangeImage image = ReturnExchangeImage.builder()
                        .request(entity)
                        .url(url)
                        .sortOrder(order2++)
                        .build();
                entity.addImage(image);
            }
        }

        ReturnExchangeRequest saved = requestRepository.save(entity);

        // 주문 상태 변경
        if (req.getType() == ReasonType.RETURN) {
            order.updateStatus(OrderStatus.RETURN_REQUESTED);
        } else {
            order.updateStatus(OrderStatus.EXCHANGE_REQUESTED);
        }

        return ReturnExchangeResponse.from(saved);
    }

    public List<ReturnExchangeResponse> getRequestsByOrderId(Long memberId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.ORDER_FORBIDDEN);
        }

        return requestRepository.findByOrderId(orderId).stream()
                .map(ReturnExchangeResponse::from)
                .toList();
    }

    public Page<ReturnExchangeResponse> getAllRequests(Pageable pageable) {
        return requestRepository.findAll(pageable).map(ReturnExchangeResponse::from);
    }

    @Transactional
    public ReturnExchangeResponse approveRequest(Long requestId, String adminMemo) {
        ReturnExchangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        if (request.getStatus() != RequestStatus.REQUESTED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST_STATUS);
        }

        request.approve(adminMemo);
        return ReturnExchangeResponse.from(request);
    }

    @Transactional
    public ReturnExchangeResponse rejectRequest(Long requestId, String adminMemo) {
        ReturnExchangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        if (request.getStatus() != RequestStatus.REQUESTED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST_STATUS);
        }

        request.reject(adminMemo);
        return ReturnExchangeResponse.from(request);
    }

    @Transactional
    public ReturnExchangeResponse completeRequest(Long requestId) {
        ReturnExchangeRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RETURN_REQUEST_NOT_FOUND));

        if (request.getStatus() != RequestStatus.APPROVED) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST_STATUS);
        }

        // 재고 복구
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(request.getOrder().getId());
        for (OrderItem item : orderItems) {
            if (item.getOptionValue() != null) {
                item.getOptionValue().increaseStock(item.getQuantity());
            }
        }

        request.complete();

        // 주문 상태 변경: 반품 → REFUNDED, 교환 → DELIVERED
        if (request.getType() == ReasonType.RETURN) {
            request.getOrder().updateStatus(OrderStatus.REFUNDED);
        } else if (request.getType() == ReasonType.EXCHANGE) {
            request.getOrder().updateStatus(OrderStatus.DELIVERED);
        }

        return ReturnExchangeResponse.from(request);
    }
}
