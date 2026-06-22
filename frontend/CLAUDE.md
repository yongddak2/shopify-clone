# frontend/CLAUDE.md

프론트엔드 전용 컨텍스트. 루트 CLAUDE.md와 함께 로드됨.

---

## 패키지 구조

```
src/
├── app/
│   ├── layout.tsx                        ← 루트 레이아웃 (Header/Footer/Providers, 폰트는 globals.css SUIT)
│   ├── page.tsx                          ← 메인 서버 컴포넌트 (dynamic, 5종 prefetch) → HomeContent.tsx
│   ├── HomeContent.tsx                   ← 메인 클라이언트 (배너 슬라이더 + NEW + BEST + Instagram, initialData 주입)
│   ├── login/page.tsx
│   ├── signup/page.tsx                   ← 약관 동의 3종
│   ├── forgot-password/page.tsx          ← 비밀번호 찾기 3단계
│   ├── terms/{page,layout}.tsx / privacy/{page,layout}.tsx  ← InfoLayout re-export로 사이드 메뉴 공유
│   ├── info/
│   │   ├── layout.tsx + InfoSidebar.tsx  ← 5메뉴 사이드(NOTICE/FAQ/Q&A/이용약관/개인정보)
│   │   ├── notice/page.tsx + [id]/       ← 공지 (마크다운 본문 + 이전/다음 + 조회수)
│   │   ├── faq/page.tsx                  ← 카테고리 탭 + 아코디언(grid-rows 트릭 애니메이션)
│   │   └── qa/page.tsx + new/ + [id]/edit/
│   ├── pntk/page.tsx + [slug]/           ← 시즌 컬렉션 (4열 풀폭 + 시즌 탭 + PhotoLightbox)
│   ├── about/page.tsx                    ← 풀스크린 ABOUT 이미지 (MainPageConfig.aboutImageUrl)
│   ├── search/page.tsx                   ← 키워드/카테고리/가격 필터
│   ├── products/
│   │   ├── page.tsx                      ← 서버 컴포넌트 (dynamic, ?category= 이름 기반 prefetch) → ProductsContent
│   │   ├── ProductsContent.tsx           ← 클라이언트 (카테고리/정렬 URL 기반 + 로드실패 재시도 UI, Suspense)
│   │   └── [id]/
│   │       ├── page.tsx                  ← 서버 컴포넌트 (params await)
│   │       ├── ProductDetailClient.tsx   ← 옵션 드롭다운 + 장바구니 + 찜
│   │       └── ReviewSection.tsx         ← 리뷰 목록/좋아요/페이지네이션
│   ├── cart/page.tsx                     ← 재고 초과 처리
│   ├── order/page.tsx                    ← 쿠폰 적용 + 카카오 주소 API + NICE 결제창 + PENDING 주문 재사용(checkoutSession)
│   ├── payment/success/page.tsx          ← 결제 완료 (쿼리파라미터만 읽음, confirm 호출 없음 / 장바구니 캐시 무효화 여기서만)
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
│       ├── banners/page.tsx + AboutImageSection.tsx + InstagramSection.tsx
│       ├── seasons/page.tsx + [id]/photos/  ← PNTK 시즌 CRUD + 사진 multipart 업로드/드래그 정렬
│       └── requests/page.tsx             ← 반품/교환 관리 5탭
├── lib/
│   ├── api.ts            ← axios 인스턴스(baseURL=NEXT_PUBLIC_API_BASE_URL, prod 필수), 401 자동 재발급. 서버 prefetch는 INTERNAL_API_BASE_URL
│   ├── auth.ts           ← signup/login/logout/refresh/비밀번호찾기
│   ├── product.ts        ← getProducts/getProductDetail/getCategories/searchProducts
│   ├── cart.ts           ← getCart/addToCart/updateCartQuantity/removeCartItem
│   ├── order.ts          ← getOrders/getOrderDetail/createOrder/cancelOrder/confirmOrder
│   ├── user.ts           ← getMyInfo/주소 CRUD/changePassword
│   ├── checkoutSession.ts ← sessionStorage 헬퍼 (beginCheckout/readPendingCheckout/savePendingCheckout/clearCheckoutSession). PENDING 주문 재사용
│   ├── admin.ts          ← 상품/주문(+updateOrderShipping)/회원/쿠폰/배너/재고/반품교환 + getDashboard + getAdminUserDetail/updateRole/updateMemo/withdraw + updateInstagramSection/uploadInstagramImage
│   ├── wishlist.ts       ← getWishlists/toggleWishlist
│   ├── coupon.ts         ← getMyCoupons/getAvailableCoupons/issueCoupon
│   ├── review.ts         ← getProductReviews/getMyReviews/createReview/deleteReview/toggleLike/uploadImage
│   ├── season.ts         ← getPublicSeasonList/getSeasonBySlug (PNTK 공개)
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
- **폰트**: `globals.css` `@font-face` **SUIT 단일 패밀리**(9 weight, jsdelivr CDN). `--font-sans/display/serif-display` 모두 SUIT. next/font(Geist·Oswald·Abril)는 layout.tsx에서 제거됨

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
- `invalidateSeasonRelated` — pntk-seasons, season, admin seasons, admin season-images
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
carrier, trackingNumber: string|null ← 운송장 표시
```

### 어드민 주문 (AdminOrder)
```
totalAmount, finalAmount       ← 상품구매금액 vs 실결제금액 분리 표시
paymentMethod: CARD/TRANSFER/VIRTUAL | null  ← 결제 전이면 null, 한글 매핑 필요
memberName                     ← 주문자 컬럼에 #ID와 함께 표시
carrier, trackingNumber: string|null  ← 운송장 (PATCH /api/admin/orders/{id}/shipping)
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

## 결제 흐름 (중요) — NICE페이먼츠

1. cart/상품상세에서 `beginCheckout(cartItemIds)` (sessionStorage 저장)
2. `/order`에서 `createOrder`(PENDING 생성) + `savePendingCheckout`
3. `window.AUTHNICE.requestPay({ clientId, orderId, amount, returnUrl: ${API_BASE_URL}/api/payments/nice/callback, ... })` → NICE 인증창 (스크립트 `https://pay.nicepay.co.kr/v1/js/`)
4. NICE가 **백엔드로 form POST** → 백엔드 `confirmNicePayment`(서명·금액 검증 + 승인 API) → `303` 리다이렉트
5. 성공 → `/payment/success?orderId&orderNumber&amount` (프론트는 **confirm 호출 없이** 쿼리만 읽어 표시 + `invalidateAfterPayment` + `clearCheckoutSession`) / 실패 → `/payment/fail?code&message`

- **PENDING 주문 재사용**: 결제창 닫고 재진입 시 `readPendingCheckout`로 복원 → `getOrderDetail`로 여전히 PENDING인지 확인 후 NICE만 재호출(아니면 세션 정리). 버튼 라벨 "결제 다시 시도하기"
- env: `NEXT_PUBLIC_NICEPAY_CLIENT_KEY`, `NEXT_PUBLIC_API_BASE_URL` 필수 (구 `NEXT_PUBLIC_TOSS_CLIENT_KEY` 제거)

**장바구니 캐시 무효화는 반드시 `payment/success`에서만.**
order 페이지에서 무효화하면 빈 장바구니 감지 → 결제창 차단됨.
