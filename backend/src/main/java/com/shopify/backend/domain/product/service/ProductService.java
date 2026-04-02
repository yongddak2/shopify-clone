package com.shopify.backend.domain.product.service;

import com.shopify.backend.domain.product.dto.CategoryResponse;
import com.shopify.backend.domain.product.dto.ProductDetailResponse;
import com.shopify.backend.domain.product.dto.ProductSummaryResponse;
import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductStatus;
import com.shopify.backend.domain.product.repository.CategoryRepository;
import com.shopify.backend.domain.product.repository.ProductRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public Page<ProductSummaryResponse> getProducts(int page, int size, String sort) {
        Sort sorting = switch (sort) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "basePrice");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "basePrice");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };

        Pageable pageable = PageRequest.of(page, size, sorting);
        return productRepository.findByStatusAndDeletedAtIsNull(ProductStatus.ACTIVE, pageable)
                .map(ProductSummaryResponse::from);
    }

    @Transactional
    public ProductDetailResponse getProduct(Long id) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        product.incrementViewCount();
        return ProductDetailResponse.from(product);
    }

    public List<CategoryResponse> getCategories() {
        return categoryRepository.findByParentIsNull().stream()
                .map(CategoryResponse::from)
                .toList();
    }
}
