package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.NewArrivalAddRequest;
import com.pantrka.backend.domain.admin.dto.NewArrivalMoveRequest;
import com.pantrka.backend.domain.admin.dto.NewArrivalReorderRequest;
import com.pantrka.backend.domain.admin.dto.NewArrivalReplaceRequest;
import com.pantrka.backend.domain.admin.dto.NewArrivalResponse;
import com.pantrka.backend.domain.admin.entity.MainPageNewArrival;
import com.pantrka.backend.domain.admin.repository.MainPageNewArrivalRepository;
import com.pantrka.backend.domain.product.dto.ProductSummaryResponse;
import com.pantrka.backend.domain.product.entity.Product;
import com.pantrka.backend.domain.product.entity.ProductStatus;
import com.pantrka.backend.domain.product.repository.ProductRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainPageNewArrivalService {

    public static final int MAX_ENTRIES = 10;

    private final MainPageNewArrivalRepository repository;
    private final ProductRepository productRepository;

    public List<NewArrivalResponse> getAdminList() {
        return repository.findAllByOrderBySortOrderAsc().stream()
                .filter(e -> e.getProduct().getDeletedAt() == null)
                .map(NewArrivalResponse::from)
                .toList();
    }

    public List<ProductSummaryResponse> getPublicList() {
        return repository.findAllByOrderBySortOrderAsc().stream()
                .map(MainPageNewArrival::getProduct)
                .filter(p -> p.getDeletedAt() == null && p.getStatus() != ProductStatus.INACTIVE)
                .map(ProductSummaryResponse::from)
                .toList();
    }

    @Transactional
    public List<NewArrivalResponse> addProducts(NewArrivalAddRequest request) {
        List<Long> requestedIds = request.getProductIds().stream().distinct().toList();

        List<MainPageNewArrival> existing = repository.findAllByOrderBySortOrderAsc();
        if (existing.size() + requestedIds.size() > MAX_ENTRIES) {
            throw new BusinessException(ErrorCode.NEW_ARRIVAL_LIMIT_EXCEEDED);
        }

        Set<Long> alreadyRegistered = new HashSet<>();
        existing.forEach(e -> alreadyRegistered.add(e.getProduct().getId()));

        for (Long productId : requestedIds) {
            if (alreadyRegistered.contains(productId)) {
                throw new BusinessException(ErrorCode.NEW_ARRIVAL_ALREADY_REGISTERED);
            }
        }

        int nextSortOrder = existing.isEmpty()
                ? 1
                : existing.get(existing.size() - 1).getSortOrder() + 1;

        for (Long productId : requestedIds) {
            Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            repository.save(MainPageNewArrival.builder()
                    .product(product)
                    .sortOrder(nextSortOrder++)
                    .build());
        }

        return getAdminList();
    }

    @Transactional
    public void delete(Long id) {
        MainPageNewArrival entry = repository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NEW_ARRIVAL_NOT_FOUND));
        repository.delete(entry);
    }

    @Transactional
    public List<NewArrivalResponse> move(Long id, NewArrivalMoveRequest request) {
        List<MainPageNewArrival> list = new ArrayList<>(repository.findAllByOrderBySortOrderAsc());
        list.sort(Comparator.comparingInt(MainPageNewArrival::getSortOrder));

        int index = -1;
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).getId().equals(id)) {
                index = i;
                break;
            }
        }
        if (index < 0) {
            throw new BusinessException(ErrorCode.NEW_ARRIVAL_NOT_FOUND);
        }

        int swapIndex = request.getDirection() == NewArrivalMoveRequest.Direction.UP
                ? index - 1
                : index + 1;
        if (swapIndex < 0 || swapIndex >= list.size()) {
            return getAdminList();
        }

        MainPageNewArrival a = list.get(index);
        MainPageNewArrival b = list.get(swapIndex);
        int tmp = a.getSortOrder();
        a.updateSortOrder(b.getSortOrder());
        b.updateSortOrder(tmp);

        return getAdminList();
    }

    @Transactional
    public List<NewArrivalResponse> replace(NewArrivalReplaceRequest request) {
        List<Long> productIds = request.getProductIds().stream().distinct().toList();
        if (productIds.size() > MAX_ENTRIES) {
            throw new BusinessException(ErrorCode.NEW_ARRIVAL_LIMIT_EXCEEDED);
        }

        repository.deleteAllInBatch();

        int sortOrder = 1;
        for (Long productId : productIds) {
            Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
            repository.save(MainPageNewArrival.builder()
                    .product(product)
                    .sortOrder(sortOrder++)
                    .build());
        }

        return getAdminList();
    }

    @Transactional
    public List<NewArrivalResponse> reorder(NewArrivalReorderRequest request) {
        List<MainPageNewArrival> existing = repository.findAllByOrderBySortOrderAsc();
        Map<Long, MainPageNewArrival> byId = existing.stream()
                .collect(Collectors.toMap(MainPageNewArrival::getId, Function.identity()));

        List<Long> orderedIds = request.getOrderedIds();
        if (orderedIds.size() != existing.size() || !byId.keySet().equals(new HashSet<>(orderedIds))) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        int sortOrder = 1;
        for (Long id : orderedIds) {
            byId.get(id).updateSortOrder(sortOrder++);
        }

        return getAdminList();
    }
}
