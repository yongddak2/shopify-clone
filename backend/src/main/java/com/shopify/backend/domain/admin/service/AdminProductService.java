package com.shopify.backend.domain.admin.service;

import com.shopify.backend.domain.admin.dto.AdminProductCreateRequest;
import com.shopify.backend.domain.admin.dto.AdminProductOptionUpdateRequest;
import com.shopify.backend.domain.admin.dto.AdminProductResponse;
import com.shopify.backend.domain.admin.dto.AdminProductUpdateRequest;
import com.shopify.backend.domain.admin.dto.InventoryResponse;
import java.util.Comparator;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.product.entity.*;
import com.shopify.backend.domain.product.repository.*;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductOptionGroupRepository productOptionGroupRepository;
    private final ProductOptionValueRepository productOptionValueRepository;
    private final OrderItemRepository orderItemRepository;

    public Page<AdminProductResponse> getProducts(int page, int size) {
        Page<Product> products = productRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return products.map(AdminProductResponse::from);
    }

    public AdminProductResponse getProduct(Long productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
        return AdminProductResponse.from(product);
    }

    public List<InventoryResponse> getInventory() {
        List<Product> products = productRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .sorted(Comparator.comparing(Product::getId))
                .toList();

        List<InventoryResponse> result = new ArrayList<>();
        for (Product product : products) {
            List<ProductOptionValue> values = new ArrayList<>();
            for (ProductOptionGroup group : product.getOptionGroups()) {
                values.addAll(group.getOptionValues());
            }
            values.sort(Comparator.comparing(ProductOptionValue::getId));
            for (ProductOptionValue value : values) {
                result.add(InventoryResponse.from(product, value));
            }
        }
        return result;
    }

    @Transactional
    public InventoryResponse updateStock(Long optionValueId, int stockQuantity) {
        if (stockQuantity < 0) {
            throw new BusinessException(ErrorCode.INVALID_STOCK_QUANTITY);
        }
        ProductOptionValue optionValue = productOptionValueRepository.findById(optionValueId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_OPTION_NOT_FOUND));
        optionValue.updateStockQuantity(stockQuantity);
        Product product = optionValue.getOptionGroup().getProduct();
        return InventoryResponse.from(product, optionValue);
    }

    @Transactional
    public AdminProductResponse createProduct(AdminProductCreateRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        Product product = Product.builder()
                .category(category)
                .name(request.getName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .discountRate(request.getDiscountRate() != null ? request.getDiscountRate() : BigDecimal.ZERO)
                .status(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE)
                .build();

        productRepository.save(product);

        // 이미지 저장
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            List<ProductImage> images = request.getImages().stream()
                    .map(dto -> ProductImage.builder()
                            .product(product)
                            .url(dto.getUrl())
                            .sortOrder(dto.getSortOrder())
                            .isThumbnail(dto.isThumbnail())
                            .build())
                    .toList();
            productImageRepository.saveAll(images);
            product.getImages().addAll(images);
        }

        // 옵션 그룹 + 옵션 값 저장
        if (request.getOptionGroups() != null && !request.getOptionGroups().isEmpty()) {
            for (AdminProductCreateRequest.ProductOptionGroupDto groupDto : request.getOptionGroups()) {
                ProductOptionGroup group = ProductOptionGroup.builder()
                        .product(product)
                        .name(groupDto.getName())
                        .build();
                productOptionGroupRepository.save(group);
                product.getOptionGroups().add(group);

                if (groupDto.getOptionValues() != null && !groupDto.getOptionValues().isEmpty()) {
                    List<ProductOptionValue> values = groupDto.getOptionValues().stream()
                            .map(valueDto -> ProductOptionValue.builder()
                                    .optionGroup(group)
                                    .value(valueDto.getValue())
                                    .additionalPrice(valueDto.getAdditionalPrice() != null
                                            ? valueDto.getAdditionalPrice() : BigDecimal.ZERO)
                                    .stockQuantity(valueDto.getStockQuantity())
                                    .build())
                            .toList();
                    productOptionValueRepository.saveAll(values);
                    group.getOptionValues().addAll(values);
                }
            }
        }

        return AdminProductResponse.from(product);
    }

    @Transactional
    public AdminProductResponse updateProduct(Long productId, AdminProductUpdateRequest request) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        product.update(
                request.getName(),
                request.getDescription(),
                request.getBasePrice(),
                request.getDiscountRate(),
                request.getStatus()
        );

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
            product.updateCategory(category);
        }

        // 이미지 동기화 (null = 미수정, 빈 배열 = 전체 삭제)
        if (request.getImages() != null) {
            Set<Long> requestedImageIds = request.getImages().stream()
                    .map(AdminProductUpdateRequest.ProductImageDto::getId)
                    .filter(id -> id != null)
                    .collect(Collectors.toSet());

            // 1) 요청에 없는 기존 이미지 삭제
            List<ProductImage> existingSnapshot = new ArrayList<>(product.getImages());
            for (ProductImage existing : existingSnapshot) {
                if (!requestedImageIds.contains(existing.getId())) {
                    product.getImages().remove(existing);
                    productImageRepository.delete(existing);
                }
            }
            // 동일 트랜잭션 내 후속 처리 전 DELETE SQL 즉시 반영
            productImageRepository.flush();

            // 2) 기존 이미지 sortOrder/isThumbnail 업데이트
            for (AdminProductUpdateRequest.ProductImageDto imgReq : request.getImages()) {
                if (imgReq.getId() != null) {
                    for (ProductImage existing : product.getImages()) {
                        if (existing.getId().equals(imgReq.getId())) {
                            existing.update(imgReq.getSortOrder(), imgReq.isThumbnail());
                            break;
                        }
                    }
                }
            }

            // 3) 신규 이미지 추가
            for (AdminProductUpdateRequest.ProductImageDto imgReq : request.getImages()) {
                if (imgReq.getId() == null) {
                    ProductImage newImage = ProductImage.builder()
                            .product(product)
                            .url(imgReq.getUrl())
                            .sortOrder(imgReq.getSortOrder())
                            .isThumbnail(imgReq.isThumbnail())
                            .build();
                    productImageRepository.save(newImage);
                    product.getImages().add(newImage);
                }
            }
        }

        // 옵션 수정
        if (request.getOptionValues() != null) {
            ProductOptionGroup group;
            if (product.getOptionGroups().isEmpty()) {
                // 옵션 그룹이 없으면 새로 생성
                group = ProductOptionGroup.builder()
                        .product(product)
                        .name(request.getOptionGroupName() != null ? request.getOptionGroupName() : "옵션")
                        .build();
                productOptionGroupRepository.save(group);
                product.getOptionGroups().add(group);
            } else {
                group = product.getOptionGroups().get(0);
            }

            // 요청에 포함된 기존 옵션 ID 목록
            Set<Long> requestedIds = request.getOptionValues().stream()
                    .filter(o -> o.getId() != null)
                    .map(AdminProductOptionUpdateRequest::getId)
                    .collect(Collectors.toSet());

            // 삭제 대상 별도 수집 (ConcurrentModificationException 방지)
            List<ProductOptionValue> toDelete = new ArrayList<>();
            for (ProductOptionValue existing : group.getOptionValues()) {
                if (requestedIds.contains(existing.getId())) {
                    // 기존 옵션 수정
                    AdminProductOptionUpdateRequest req = request.getOptionValues().stream()
                            .filter(o -> existing.getId().equals(o.getId()))
                            .findFirst().orElseThrow();
                    existing.update(req.getValue(), req.getStockQuantity(), req.getAdditionalPrice());
                } else {
                    // 요청에 없는 옵션 → 삭제 분기
                    if (orderItemRepository.existsByOptionValueId(existing.getId())) {
                        existing.softDelete(); // 주문 이력 있으면 재고 0 처리
                    } else {
                        toDelete.add(existing);
                    }
                }
            }
            group.getOptionValues().removeAll(toDelete);
            for (ProductOptionValue del : toDelete) {
                productOptionValueRepository.delete(del);
            }

            // 신규 옵션 추가 (id == null인 항목)
            for (AdminProductOptionUpdateRequest req : request.getOptionValues()) {
                if (req.getId() == null) {
                    ProductOptionValue newOption = ProductOptionValue.builder()
                            .optionGroup(group)
                            .value(req.getValue())
                            .stockQuantity(req.getStockQuantity())
                            .additionalPrice(BigDecimal.valueOf(req.getAdditionalPrice()))
                            .build();
                    productOptionValueRepository.save(newOption);
                    group.getOptionValues().add(newOption);
                }
            }
        }

        return AdminProductResponse.from(product);
    }

    @Transactional
    public void deleteProduct(Long productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        product.softDelete();
    }
}
