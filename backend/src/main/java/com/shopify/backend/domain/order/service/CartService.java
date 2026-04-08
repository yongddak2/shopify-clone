package com.shopify.backend.domain.order.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.order.dto.CartItemRequest;
import com.shopify.backend.domain.order.dto.CartItemResponse;
import com.shopify.backend.domain.order.dto.CartItemUpdateRequest;
import com.shopify.backend.domain.order.entity.CartItem;
import com.shopify.backend.domain.order.repository.CartItemRepository;
import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductOptionValue;
import com.shopify.backend.domain.product.repository.ProductOptionValueRepository;
import com.shopify.backend.domain.product.repository.ProductRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductOptionValueRepository productOptionValueRepository;
    private final MemberRepository memberRepository;

    public List<CartItemResponse> getCartItems(Long memberId) {
        return cartItemRepository.findByMemberId(memberId).stream()
                .map(CartItemResponse::from)
                .toList();
    }

    @Transactional
    public CartItemResponse addCartItem(Long memberId, CartItemRequest request) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(request.getProductId())
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductOptionValue optionValue = null;
        if (request.getOptionValueId() != null) {
            optionValue = productOptionValueRepository.findById(request.getOptionValueId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_OPTION_NOT_FOUND));

            if (optionValue.getStockQuantity() < request.getQuantity()) {
                throw new BusinessException(ErrorCode.OUT_OF_STOCK);
            }
        }

        Optional<CartItem> existingItem = cartItemRepository
                .findByMemberIdAndProductIdAndOptionValueId(memberId, request.getProductId(), request.getOptionValueId());

        if (existingItem.isPresent()) {
            CartItem cartItem = existingItem.get();
            int newQuantity = cartItem.getQuantity() + request.getQuantity();

            if (optionValue != null && optionValue.getStockQuantity() < newQuantity) {
                throw new BusinessException(ErrorCode.OUT_OF_STOCK);
            }

            cartItem.updateQuantity(newQuantity);
            return CartItemResponse.from(cartItem);
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        CartItem cartItem = CartItem.builder()
                .member(member)
                .product(product)
                .optionValue(optionValue)
                .quantity(request.getQuantity())
                .build();

        cartItemRepository.save(cartItem);
        return CartItemResponse.from(cartItem);
    }

    @Transactional
    public CartItemResponse updateCartItem(Long memberId, Long cartItemId, CartItemUpdateRequest request) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (!cartItem.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.CART_ITEM_FORBIDDEN);
        }

        // 수량이 증가하는 경우에만 재고 검증 (감소는 재고 부족 상태에서도 항상 허용)
        if (request.getQuantity() > cartItem.getQuantity()
                && cartItem.getOptionValue() != null
                && cartItem.getOptionValue().getStockQuantity() < request.getQuantity()) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK);
        }

        cartItem.updateQuantity(request.getQuantity());
        return CartItemResponse.from(cartItem);
    }

    @Transactional
    public void deleteCartItem(Long memberId, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (!cartItem.getMember().getId().equals(memberId)) {
            throw new BusinessException(ErrorCode.CART_ITEM_FORBIDDEN);
        }

        cartItemRepository.delete(cartItem);
    }
}
