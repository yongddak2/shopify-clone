import type { QueryClient } from "@tanstack/react-query";

/**
 * 도메인별 쿼리 무효화 헬퍼.
 *
 * 사용 원칙:
 * - mutation 성공 시 영향받는 도메인의 헬퍼를 호출한다.
 * - 새 페이지/쿼리 추가 시 이 파일에 키만 등록하면 모든 mutation에 자동 반영된다.
 * - 쿼리 키는 항상 배열 형태로, 첫 번째 요소를 도메인 식별자로 쓴다 (prefix 매칭 활용).
 *
 * 예) ["orders", page] → invalidate({ queryKey: ["orders"] }) 한 번이면 모든 페이지 갱신.
 */

// ─────────────────────────────────────────────────────────────
// Order (주문, 반품/교환)
// ─────────────────────────────────────────────────────────────
export const invalidateOrderRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["orders"] });
  qc.invalidateQueries({ queryKey: ["order"] });
  qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  qc.invalidateQueries({ queryKey: ["admin", "requests"] });
};

// ─────────────────────────────────────────────────────────────
// Product (상품, 옵션, 재고)
// ─────────────────────────────────────────────────────────────
export const invalidateProductRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["products"] });
  qc.invalidateQueries({ queryKey: ["product"] });
  qc.invalidateQueries({ queryKey: ["admin", "products"] });
  qc.invalidateQueries({ queryKey: ["mainNewProducts"] });
  qc.invalidateQueries({ queryKey: ["mainBestProducts"] });
  qc.invalidateQueries({ queryKey: ["searchProducts"] });
};

// ─────────────────────────────────────────────────────────────
// Cart (장바구니)
// ─────────────────────────────────────────────────────────────
export const invalidateCartRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["cart"] });
};

// ─────────────────────────────────────────────────────────────
// Wishlist (찜)
// ─────────────────────────────────────────────────────────────
export const invalidateWishlistRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["wishlists"] });
};

// ─────────────────────────────────────────────────────────────
// Coupon (쿠폰)
// ─────────────────────────────────────────────────────────────
export const invalidateCouponRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["myCoupons"] });
  qc.invalidateQueries({ queryKey: ["availableCoupons"] });
  qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
};

// ─────────────────────────────────────────────────────────────
// Banner (배너)
// ─────────────────────────────────────────────────────────────
export const invalidateBannerRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["publicBanners"] });
  qc.invalidateQueries({ queryKey: ["admin", "banners"] });
};

// ─────────────────────────────────────────────────────────────
// Review (리뷰)
// ─────────────────────────────────────────────────────────────
export const invalidateReviewRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["reviews"] });
  qc.invalidateQueries({ queryKey: ["myReviews"] });
};

// ─────────────────────────────────────────────────────────────
// Address (배송지)
// ─────────────────────────────────────────────────────────────
export const invalidateAddressRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["addresses"] });
};

// ─────────────────────────────────────────────────────────────
// User (회원 정보)
// ─────────────────────────────────────────────────────────────
export const invalidateUserRelated = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ["myInfo"] });
};

// ─────────────────────────────────────────────────────────────
// 복합: 결제 완료 — 주문/장바구니/재고/쿠폰 모두 영향
// ─────────────────────────────────────────────────────────────
export const invalidateAfterPayment = (qc: QueryClient) => {
  invalidateOrderRelated(qc);
  invalidateCartRelated(qc);
  invalidateProductRelated(qc);
  invalidateCouponRelated(qc);
};
