package com.shopify.backend.domain.wishlist.controller;

import com.shopify.backend.domain.wishlist.dto.WishlistResponse;
import com.shopify.backend.domain.wishlist.service.WishlistService;
import com.shopify.backend.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlists")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistResponse>>> getWishlists(Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        List<WishlistResponse> response = wishlistService.getWishlists(memberId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> toggleWishlist(
            Authentication authentication,
            @PathVariable Long productId) {
        Long memberId = (Long) authentication.getPrincipal();
        String message = wishlistService.toggleWishlist(memberId, productId);
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }
}
