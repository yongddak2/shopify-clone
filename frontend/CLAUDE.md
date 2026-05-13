# frontend/CLAUDE.md

프론트엔드 전용 컨텍스트. 루트 CLAUDE.md와 함께 로드됨.

---

## 패키지 구조

```
src/
├── app/
│   ├── layout.tsx                        ← 루트 레이아웃 (Header/Footer/Providers)
│   ├── page.tsx                          ← 메인 (배너 슬라이더 + NEW ARRIVALS + BEST)
│   ├── login/page.tsx
│   ├── signup/page.tsx                   ← 약관 동의 3종
│   ├── forgot-password/page.tsx          ← 비밀번호 찾기 3단계
│   ├── terms/page.tsx / privacy/page.tsx
│   ├── search/page.tsx                   ← 키워드/카테고리/가격 필터
│   ├── products/
│   │   ├── page.tsx                      ← 상품 목록 + 찜 하트
│   │   └── [id]/
│   │       ├── page.tsx                  ← 서버 컴포넌트 (params await)
│   │       ├── ProductDetailClient.tsx   ← 옵션 드롭다운 + 장바구니 + 찜
│   │       └── ReviewSection.tsx         ← 리뷰 목록/좋아요/페이지네이션
│   ├── cart/page.tsx                     ← 재고 초과 처리
│   ├── order/page.tsx                    ← 쿠폰 적용 + 카카오 주소 API
│   ├── payment/success/page.tsx          ← 결제 완료 (장바구니 캐시 무효화 여기서만)
│   ├── payment/fail/page.tsx             ← Suspense로 감싸야 빌드 통과
│   ├── mypage/
│   │   ├── layout.tsx                    ← 사이드메뉴 + 대시보드 카드
│   │   ├── orders/page.tsx               ← 5탭 + confirmedAt 기반 버튼 분기
│   │   ├── orders/[id]/page.tsx
│   │   ├── orders/[id]/return-exchange/page.tsx
│   │   ├── addresses/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── coupons/page.tsx              ← 다운로드 섹션 + 3탭
│   │   ├── reviews/page.tsx              ← 모달 방식, confirmedAt 기반
│   │   └── profile/page.tsx
│   └── admin/
│       ├── layout.tsx                    ← 240px 사이드바, Header/Footer 미사용
│       ├── page.tsx                      ← 대시보드 (카드 6개 + BarChart + PieChart + TOP5 + 재고부족 + 최근주문)
│       ├── products/
│       │   ├── page.tsx                  ← 상품 목록
│       │   ├── new/page.tsx              ← 상품 등록
│       │   └── [id]/edit/page.tsx        ← 2컬럼: 기본정보 / 옵션+이미지
│       ├── inventory/page.tsx
│       ├── orders/page.tsx               ← SHIPPED 변경 시 운송장 입력 모달
│       ├── users/
│       │   ├── page.tsx                  ← 회원 목록 (필터 탭: 전체/이번달 신규)
│       │   └── [id]/page.tsx             ← 회원 상세 (통계/메모/권한 변경/강제 탈퇴, 본인 차단)
│       ├── coupons/
│       │   ├── page.tsx                  ← CRUD + 🎁 웰컴 뱃지
│       │   └── new/page.tsx              ← 웰컴 토글 체크박스
│       ├── banners/page.tsx
│       └── requests/page.tsx             ← 반품/교환 관리 5탭
├── lib/
│   ├── api.ts            ← axios 인스턴스, 401 자동 재발급
│   ├── auth.ts           ← signup/login/logout/refresh/비밀번호찾기
│   ├── product.ts        ← getProducts/getProductDetail/getCategories/searchProducts
│   ├── cart.ts           ← getCart/addToCart/updateCartQuantity/removeCartItem
│   ├── order.ts          ← getOrders/getOrderDetail/createOrder/cancelOrder/confirmOrder
│   ├── user.ts           ← getMyInfo/주소 CRUD/changePassword
│   ├── payment.ts        ← confirmPayment (orderNumber 기반)
│   ├── admin.ts          ← 상품/주문/회원/쿠폰/배너/재고/반품교환 + getDashboard + getAdminUserDetail/updateRole/updateMemo/withdraw
│   ├── wishlist.ts       ← getWishlists/toggleWishlist
│   ├── coupon.ts         ← getMyCoupons/getAvailableCoupons/issueCoupon
│   ├── review.ts         ← getProductReviews/getMyReviews/createReview/deleteReview/toggleLike/uploadImage
│   └── queryInvalidator.ts
├── stores/authStore.ts   ← zustand + persist, SSR 안전 처리
└── types/index.ts        ← 공통 타입 전체
```

---

## 라이트 테마 일관성

- 단일 라이트 테마 (`globals.css` `:root` 변수). 다크 테마 토글 없음
- **다크 헥스 하드코딩 금지** — `bg-[#2a2a2a]`, `border-[#555]` 같은 임시 색상 X
- 인라인 `style={{ backgroundColor: "..." }}` 도 동일 규칙. 정규식 검색 회피의 함정이라 특히 주의
- 입력/카드/드롭다운 등 — `var(--input-bg)` / `var(--card-bg)` / `var(--border-color)` / `var(--text-secondary)` 사용
- 선택 강조는 `bg-[var(--text-primary)] text-[var(--btn-primary-text)]` (invert 효과)

---

## React Query 캐시 전략

### queryInvalidator.ts 도메인별 함수
- `invalidateOrderRelated` — orders, order, admin orders, admin requests, admin dashboard
- `invalidateProductRelated` — products, product, admin products, main, search, admin inventory, admin dashboard
- `invalidateCartRelated` — cart
- `invalidateWishlistRelated` — wishlists
- `invalidateCouponRelated` — coupons, myCoupons
- `invalidateBannerRelated` — banners
- `invalidateMainPageConfigRelated` — mainPageConfig, admin mainPageConfig
- `invalidateReviewRelated` — reviews, myReviews
- `invalidateAddressRelated` — addresses
- `invalidateUserRelated` — user
- `invalidateDashboardRelated` — admin dashboard
- `invalidateAdminMemberRelated` — admin users, admin user, admin dashboard
- `invalidateAfterPayment` — 결제 완료 시 4개 도메인 일괄

### 운영 원칙
- 모든 mutation onSuccess에서 도메인 헬퍼 호출
- 새 페이지/쿼리 추가 시: 헬퍼에 쿼리 키 추가 → mutation onSuccess에 헬퍼 호출 확인

### staleTime
- 실시간 (mypage/orders, admin/orders, admin/requests, admin/inventory): `0`
- 일반 (전역 기본값): `60_000` (60초)
- 대시보드 (admin/dashboard): `60_000`
- 거의 안 바뀜 (categories): `300_000` (5분)

---

## 상품 옵션 드롭다운 분기 (ProductDetailClient.tsx)

```
value === "FREE"       → 드롭다운 없음, 자동 선택
value에 "-" 포함       → 색상/사이즈 분리 드롭다운
                          (색상 선택 후 사이즈 활성화)
그 외                  → 단일 드롭다운
stock === 0            → (품절) 표시 + disabled
```
- 외부 클릭 시 드롭다운 자동 닫힘
- 옵션 변경 시 quantity 1로 리셋

---

## 장바구니 재고 초과 처리 (cart/page.tsx)

- `CartItemResponse.stockQuantity` 백엔드에서 제공
- 재고 초과 항목: `opacity-40 grayscale` + 상단 sticky 경고 배너
- **− 버튼은 재고 초과 상태에서도 항상 활성** (수량 줄이기 허용, `quantity <= 1`만 검사)
- 체크박스: 재고 초과 항목 자동 해제 + disabled, 수량 조정 후 자동 복원
- 주문하기: 재고 초과 체크 항목 있으면 차단

---

## 핵심 API 응답 필드 명세

### 장바구니 (CartItemResponse)
```
basePrice, additionalPrice, discountRate  ← 프론트에서 할인가 계산
stockQuantity                             ← 재고 초과 처리에 사용
```

### 상품 목록 (ProductSummaryResponse)
```
thumbnailUrl: string   ← images 배열 아님. product.images[0] 사용 금지
```

### 주문 응답 (OrderResponse)
```
couponName, couponDiscountAmount   ← 쿠폰 할인 표시
returnRequested, exchangeRequested ← 반품/교환 버튼 분기
confirmedAt: string | null         ← 구매확정 여부 판단
```

### 어드민 주문 (AdminOrder)
```
totalAmount, finalAmount       ← 상품구매금액 vs 실결제금액 분리 표시
paymentMethod: CARD/TRANSFER/VIRTUAL | null  ← 결제 전이면 null, 한글 매핑 필요
memberName                     ← 주문자 컬럼에 #ID와 함께 표시
```

### 주문 상태 한글 매핑
```
PENDING           → 주문대기
PAID              → 결제완료
PREPARING         → 배송준비중
SHIPPED           → 배송중
DELIVERED         → 배송완료
CANCELLED         → 주문취소
REFUNDED          → 환불완료
RETURN_REQUESTED  → 반품신청
EXCHANGE_REQUESTED→ 교환신청
```

---

## 결제 흐름 (중요)

주문 생성 → 토스 `requestPayment()` → `/payment/success` → `POST /api/payments/confirm` (orderNumber 기반) → 쿠폰 사용처리 → `invalidateAfterPayment()`

**장바구니 캐시 무효화는 반드시 `payment/success`에서만.**
order 페이지에서 무효화하면 빈 장바구니 감지 → 결제창 차단됨.
