package com.shopify.backend.domain.wishlist.service;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.repository.ProductRepository;
import com.shopify.backend.domain.wishlist.dto.WishlistResponse;
import com.shopify.backend.domain.wishlist.entity.Wishlist;
import com.shopify.backend.domain.wishlist.repository.WishlistRepository;
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
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final MemberRepository memberRepository;
    private final ProductRepository productRepository;

    public List<WishlistResponse> getWishlists(Long memberId) {
        return wishlistRepository.findByMemberIdOrderByCreatedAtDesc(memberId).stream()
                .map(WishlistResponse::from)
                .toList();
    }

    @Transactional
    public String toggleWishlist(Long memberId, Long productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        Optional<Wishlist> existing = wishlistRepository.findByMemberIdAndProductId(memberId, productId);

        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            return "찜 해제";
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        Wishlist wishlist = Wishlist.builder()
                .member(member)
                .product(product)
                .build();

        wishlistRepository.save(wishlist);
        return "찜 추가";
    }
}
