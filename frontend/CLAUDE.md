# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Shopify Clone frontend — 의류 쇼핑몰 프론트엔드. Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4.
백엔드(Spring Boot, localhost:8080)와 통신.

## Commands

```bash
npm run dev      # 개발 서버 (포트 3000)
npm run build    # 프로덕션 빌드
```

## Tech Stack

- Next.js 16.2.1 + React 19 + TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` 방식)
- React Query (서버 상태), zustand + persist (인증 상태)
- axios (API 호출, 토큰 인터셉터, 401 자동 재발급)
- lucide-react (아이콘)

## Architecture

```
src/
├── app/                    # 페이지 (Next.js App Router)
│   ├── layout.tsx          # 루트 레이아웃 (Header/Footer/Providers)
│   ├── page.tsx            # 메인 (배너 슬라이더 + NEW ARRIVALS + BEST)
│   ├── login/, signup/     # 인증 페이지 (signup: 이용약관/개인정보/마케팅 3종 동의)
│   ├── forgot-password/    # 비밀번호 찾기 (3단계: 이메일 → 인증번호 → 새 비밀번호)
│   ├── products/           # 상품 목록 + 상품 상세 (리뷰 섹션 포함)
│   ├── search/             # 검색 결과 페이지 (키워드/카테고리/가격 필터)
│   ├── cart/, order/, orders/  # 장바구니, 주문, 주문내역
│   ├── payment/            # 결제 성공/실패 페이지
│   ├── mypage/             # 마이페이지 (사이드메뉴 + 대시보드 레이아웃)
│   │   ├── layout.tsx      # 사이드메뉴(200px) + 대시보드 카드(배송중/배송완료/쿠폰/찜) + 모바일 탭
│   │   ├── page.tsx        # /mypage → /mypage/orders 리다이렉트
│   │   ├── orders/         # 주문내역 (5탭 + 기간필터 + 반품/교환/구매확정/리뷰 액션, 신청완료 텍스트 표시)
│   │   │   └── [id]/return-exchange/  # 반품/교환 신청 페이지 (?type=RETURN|EXCHANGE)
│   │   ├── addresses/      # 배송지 관리 (인라인 수정, 10개 제한, 카카오 주소 API)
│   │   ├── wishlist/       # 찜 목록 (하트 토글, 장바구니 담기)
│   │   ├── coupons/        # 쿠폰함 (다운로드 가능 섹션 + 3탭: 사용가능/사용완료/만료)
│   │   ├── reviews/        # 리뷰 관리 (모달 방식 작성/수정/삭제, 사진 S3 업로드, 별점 필수)
│   │   └── profile/        # 회원정보 수정 + 비밀번호 변경 + 회원 탈퇴
│   └── admin/              # 관리자 페이지 (별도 레이아웃)
│       ├── layout.tsx      # 사이드바 + 권한 체크 (ADMIN only)
│       ├── page.tsx        # 대시보드
│       ├── products/       # 상품 관리 (등록/수정/삭제, S3 이미지 업로드)
│       ├── orders/         # 주문 관리 (상태 변경, 한글 상태 뱃지)
│       ├── users/          # 회원 관리 (읽기 전용)
│       ├── coupons/        # 쿠폰 관리 (생성/수정 인라인 폼/삭제 확인 모달)
│       ├── banners/        # 배너 관리 (등록/삭제/순서변경, S3 이미지 업로드)
│       └── requests/       # 반품/교환 관리 (5탭, 승인/거절/처리완료 모달, 희망옵션 컬럼)
├── components/
│   ├── layout/             # Header, Footer
│   └── common/             # Button 등 공통 컴포넌트
├── lib/                    # API 호출 (api.ts, auth.ts, product.ts, cart.ts, order.ts, user.ts, admin.ts, wishlist.ts, coupon.ts, review.ts, payment.ts) + queryInvalidator.ts (React Query 캐시 헬퍼)
├── stores/authStore.ts     # zustand 인증 스토어
└── types/index.ts          # 공통 타입
```

## Design & Theme

- 전체 다크 테마 (차콜): CSS 변수 기반 (globals.css)
- 배경: #2a2a2a (페이지), #1e1e1e (헤더/푸터)
- 헤더: 햄버거 사이드바(왼쪽 슬라이드) + 중앙 로고 + 검색바(연결 완료) + 로그인/로그아웃 + 쇼핑백 + 마이페이지
- 비로그인 시에도 쇼핑백/마이페이지 아이콘 표시 (클릭 → /login)
- 마이페이지(👤) 아이콘 → /mypage로 이동
- 로그아웃: 확인 모달 후 실행 → window.location.href = "/" 로 메인 이동
- 관리자 페이지: 240px 사이드바 + 콘텐츠, 일반 Header/Footer 미사용
- 관리자 테이블: overflow-x-auto + min-w 설정으로 가로 스크롤 처리

## Code Patterns

- SSR Hydration 방지: mounted state 패턴 (`useState(false)` + `useEffect`)
- 인증 보호: 비로그인 → /login 리다이렉트, 관리자 → role 체크
- 에러 표시: alert() 대신 빨간 텍스트 (버튼 위 공간 미리 확보)
- 가격: 할인 적용 시 `Math.round(basePrice * (1 - discountRate / 100)) + additionalPrice`, 천단위 콤마
- 장바구니: productId 기준 그룹핑, 옵션별 수량 조절, 최근 담은 순 정렬, 체크박스 선택 결제
- 폼 유효성: noValidate + 커스텀 검증 + 빨간 텍스트
- 전화번호: 숫자만 입력 + 자동 하이픈 포맷팅 (010-1234-5678), 전송 시 하이픈 제거
- 주문 상태 한글화: 프론트에서 STATUS_LABELS 매핑 (백엔드 영문 그대로 유지)
  - 마이페이지: 색상 구분 없이 통일 스타일
  - 관리자: 색상 뱃지 유지 + 한글

## Product Options (상품 옵션)

- **상품 등록 페이지** (`admin/products/new`):
  - 사이즈/색상 각각 라디오 2개 (`'none' | 'custom'`) — '직접 설정' 선택 시 입력 영역 노출
  - 기본 사이즈: S/M/L/XL/XXL/FREE, 기본 색상: 블랙/화이트/네이비/그레이/베이지/브라운/카키/버건디 (버튼 토글 방식)
  - 직접 입력 input + 추가 버튼/Enter로 임의 값 추가, 중복 무시, 추가된 커스텀 값은 X 버튼 칩으로 표시
  - `optionCombinations` useEffect로 자동 생성:
    - 둘 다 none → `[{value: 'FREE', stock: 0}]` (단일 행, 표시는 "옵션 없음")
    - size만 custom → 사이즈 단일 행
    - color만 custom → 색상 단일 행
    - 둘 다 custom → 사이즈 × 색상 cross product (`"S-블랙"` 형식)
  - 기존 stock은 value 매칭으로 보존, 신규 조합은 0으로 초기화
- **조합형 옵션**: 등록 시 모든 조합을 하나의 optionGroup("옵션")으로 전송
  - 기존 분리형 옵션(사이즈/색상 별도 그룹)으로 등록된 레거시 상품도 하위 호환 유지
- **상품 수정 모달** (`admin/products/page.tsx`): 옵션 편집 UI 지원 (백엔드 PATCH 옵션 수정 API 연동)
  - 기존 옵션은 `optionGroups[0].values`로 초기화, 행 단위로 옵션값/재고 수정·삭제·추가 가능
  - 저장 시 `optionGroupName: "옵션"` + `optionValues: [{id, value, additionalPrice, stockQuantity}]` 전송 (id가 null이면 신규)
- **상품 상세 옵션 선택 UI** (`products/[id]/ProductDetailClient.tsx`): 드롭다운 방식
  - 파싱: `value === "FREE"` → 드롭다운 없이 자동 선택 / `-` 포함 → 사이즈×색상 조합 / 그 외 → 단일 옵션
  - 조합형: **색상 → 사이즈** 순서. 색상 선택 후 사이즈 활성화. 사이즈 dropdown은 항상 클릭 가능하지만 색상 미선택 상태에서 클릭 시 `alert("상위 옵션을 선택해주세요.")`
  - 색상 변경 시 `selectedSize` 자동 초기화
  - 각 항목 stock=0이면 `(품절)` + disabled, 색상 항목은 해당 색상의 모든 사이즈 stock=0이면 disabled
  - 외부 클릭 시 드롭다운 자동 닫힘 (mousedown 이벤트 + ref 검사)
  - 옵션 stock 입력칸 편의성: `onFocus={(e) => e.target.select()}` — 마우스 클릭 시 0이 자동 선택되어 새 입력으로 대체

## Cart Stock Handling (장바구니 재고)

- **타입**: `CartItem.stockQuantity: number` (백엔드 CartItemResponse에서 제공)
- **상품 상세 재고 제한** (`ProductDetailClient.tsx`):
  - `currentStock` 상태 — `selectedOptionValueId` 변경 시 useEffect로 추적, 옵션 변경 시 quantity를 1로 리셋
  - 수량 −/+ 버튼: `quantity <= 1` / `quantity >= currentStock`이면 disabled, 직접 입력 시에도 초과 자동 클램핑
  - 1~10개일 때 "수량 (N개 남음)" — 라벨 옆 빨간 인라인 표시 (쿠팡 스타일)
  - currentStock=0이면 장바구니 담기 버튼도 "품절" + disabled (드롭다운 차단의 이중 방어)
- **장바구니 페이지** (`cart/page.tsx`):
  - 재고 부족 항목(`item.quantity > item.stockQuantity`) 시각화: 카드에 `opacity-40 grayscale` 적용 — 빨간 강조 대신 어둡고 채도 빠진 "비활성" 느낌
  - 항목별 빨간 경고 문구: "재고 부족 (현재 재고: N개)"
  - 상단 sticky 경고 배너 (주황): "⚠ 재고가 부족한 상품이 있습니다..."
  - 수량 input + −/+ 버튼: max=`stockQuantity`, 초과 입력 자동 조정. **− 버튼은 재고 초과 상태에서도 항상 활성화** (사용자가 수량을 줄일 수 있어야 하므로 `quantity <= 1`만 검사)
  - 체크박스: 재고 초과 항목은 자동 해제 + disabled. useEffect의 `validIds`가 `i.quantity <= i.stockQuantity` 기준으로 정리, 수량을 stock 이하로 줄이면 자동으로 다시 체크 가능 상태로 전환
  - 전체 선택도 `selectableItems` 기준
  - 주문하기 차단: checked 항목 중 over-stock 발견 시 인라인 에러 "재고가 부족한 상품은 주문할 수 없습니다."

## Key API Response Differences

- 장바구니: basePrice + additionalPrice + discountRate (프론트에서 할인 계산 후 합산)
- 상품 옵션: 백엔드 `values` 키 사용 (프론트 타입도 `values`)
- 소프트 삭제: deletedAt이 null인 것만 목록 표시
- 쿠폰: CouponResponse에 totalQuantity, issuedQuantity 포함
- 상품 목록: 백엔드 ProductSummaryResponse는 `thumbnailUrl: string` 반환 (images 배열 아님)
- 주문 상품: OrderItemResponse에 `productId`, `thumbnailUrl` 포함
- 주문 응답: OrderResponse에 `couponName`, `couponDiscountAmount` 포함

## Additional Types (types/index.ts)

- `Product.thumbnailUrl: string | null` — 상품 목록 API용 (상세는 images 배열)
- `OrderRequest.memberCouponId: number | null` — 쿠폰 적용 주문
- `OrderResponse.couponName: string | null`, `couponDiscountAmount: number | null`
- `OrderItemResponse.productId: number`, `thumbnailUrl: string | null`
- `WishlistItem` — id, productId, productName, productPrice, thumbnailUrl, createdAt
- `MemberCoupon` — id, couponId, couponName, discountType, discountValue, minOrderAmount, maxDiscountAmount, usedAt, expiredAt, usable
- `User.passwordChangedAt: string | null`
- `Review` — id, memberName, rating, content, images, likeCount, liked, createdAt

## Image Upload (S3)

- 관리자 상품 등록: S3 파일 업로드
- `lib/admin.ts`: `uploadProductImage(file)` (POST /api/admin/images, FormData), `deleteProductImage(imageUrl)` (DELETE /api/admin/images)
- 프론트 유효성: 확장자(jpg/jpeg/png/gif/webp), 5MB 제한, 최대 5장
- 리뷰 이미지: S3 업로드, 최대 10장

## Search (검색)

- 헤더 검색바 → /search?keyword=xxx 이동
- 검색 결과 페이지: 키워드/카테고리/가격 범위 필터, 상품 그리드 표시
- `lib/product.ts`: `searchProducts(params)` (GET /api/products/search)

## Review (리뷰)

- 상품 상세 리뷰 섹션 (ReviewSection.tsx): 페이지네이션, 정렬(최신/높은별점/낮은별점), 좋아요 토글, 이미지 모달
- 마이페이지 리뷰 관리: 모달 방식 작성/수정/삭제, 별점 필수, 사진 S3 첨부
- 구매확정 연동: confirmedOrderIds에 포함된 주문만 리뷰 작성 가능
- `lib/review.ts`: getProductReviews, createReview, updateReview, deleteReview, toggleReviewLike, getMyReviews

## Wishlist (찜)

- `lib/wishlist.ts`: `getWishlists()` (GET /api/wishlists), `toggleWishlist(productId)` (POST /api/wishlists/{productId})
- 상품 목록(products/page.tsx): 각 상품 이미지 우하단에 하트 버튼 (로그인 시 찜 여부 표시, 비로그인 시 alert → /login)
- 상품 상세(ProductDetailClient.tsx): 상품명 옆 하트 버튼 토글
- 마이페이지 찜 목록: 그리드 카드 + 하트 해제 + 장바구니 담기(→상품 상세 이동)

## Coupon (쿠폰)

- 마이페이지 쿠폰함: 상단 다운로드 가능 쿠폰 섹션 + 3탭 (사용가능/사용완료/만료), usedAt 기반 필터링
- 다운로드 버튼 상태: 다운로드 가능 / 다운로드 완료(isIssued) / 마감(소진/만료)
- 주문 페이지 쿠폰 적용: 드롭다운 select로 사용 가능한 쿠폰 선택, 할인 금액 프론트 미리 계산 (FIXED/PERCENT)
- 주문 생성 시 memberCouponId 전달, 결제 확인 시 백엔드에서 markUsed() + 명시적 save()
- 관리자 쿠폰 관리: 생성/수정(인라인 폼)/삭제(확인 모달) — GET/POST/PATCH/DELETE /api/admin/coupons
- `lib/coupon.ts`: `getMyCoupons()` (GET /api/coupons/me), `getAvailableCoupons()` (GET /api/coupons, 다운로드 가능 목록 + isIssued)

## Purchase Confirmation (구매확정)

- POST /api/orders/{id}/confirm — 백엔드 API 연동 (Orders.confirmedAt)
- 주문내역: DELIVERED 상태에서 confirmedAt 유무로 구매확정 전/후 버튼 분기
- 리뷰 관리: confirmedAt 기반 분기 (이전 localStorage `confirmedOrderIds` 코드 제거됨)

## Signup Terms (회원가입 약관 동의)

- 이용약관(필수) / 개인정보 처리방침(필수) / 마케팅 수신(선택) 3종 체크박스
- 전체 동의 토글, 필수 미동의 시 가입 버튼 비활성화
- 약관 내용 모달 (현재 플레이스홀더, 추후 실제 내용 교체 예정)

## Forgot Password (비밀번호 찾기)

- /forgot-password 3단계 스텝 UI: 이메일 입력 → 인증번호 입력 → 새 비밀번호 설정
- POST /api/auth/password-reset/send / verify / reset 호출
- 재발송 30초 쿨타임 (프론트 카운트다운 + 백엔드 검증)
- 로그인 페이지에 "비밀번호를 잊으셨나요?" 링크 추가

## Password Change (비밀번호 변경)

- PATCH /api/users/me/password (currentPassword, newPassword, newPasswordConfirm)
- 유효성: 8자 이상 + 영문 + 숫자 + 특수문자 (프론트/백엔드 동일 정규식)
- 실시간 조건 표시 (8자/영문/숫자/특수문자 각각 체크), 확인 일치 실시간 표시
- 30일 제한: Member.passwordChangedAt 기반, 30일 이내 재변경 시 예외
- 마지막 변경일 표시, 눈 아이콘 tabIndex={-1} (Tab 포커스 제외)

## Payment (결제)

- 토스페이먼츠 API 개별 연동 (SDK: `https://js.tosspayments.com/v1/payment`)
- 클라이언트 키: 환경변수 `NEXT_PUBLIC_TOSS_CLIENT_KEY` (기본값: 테스트 키)
- 흐름: 주문 생성(POST /api/orders) → 토스 결제창(리다이렉트 방식) → 성공 시 /payment/success → POST /api/payments/confirm (orderNumber로 조회) → 결제 완료 UI
- 결제 완료 페이지: 주문번호/결제금액 표시, "쇼핑 계속하기"/"주문 상세 보기" 버튼, 장바구니 캐시 무효화 + sessionStorage 정리
- 실패 시 /payment/fail 페이지 표시
- 주소 입력: 카카오 우편번호 API (Daum Postcode) 연동 완료
- **주의**: 장바구니 캐시 무효화(invalidateQueries["cart"])는 반드시 payment/success에서만 실행 (order 페이지에서 하면 빈 장바구니 감지 → /cart 리다이렉트로 결제창 차단됨)

## Main Page (메인 페이지)

- 배너 슬라이더: fade 전환, 자동 재생, 관리자에서 등록한 배너 표시
- NEW ARRIVALS: 최신 상품 API 연동
- BEST: 판매량 기준 상품 API 연동

## Admin Banners (관리자 배너)

- /admin/banners: 배너 등록/삭제/순서변경
- S3 이미지 업로드, 링크 URL 설정, 활성/비활성 토글
- 최대 5개 제한

## Return/Exchange (반품/교환)

- **신청 페이지**: `mypage/orders/[id]/return-exchange/page.tsx` (?type=RETURN|EXCHANGE 쿼리)
  - 주문 상품 정보 카드 (썸네일/상품명/옵션/수량/금액)
  - 사유 라디오 2그룹 (단순 변심 4개 / 상품·배송 문제 5개)
  - 상세 사유 텍스트 (500자 카운터, SELLER_FAULT 선택 시 사진 첨부 권장 안내)
  - 사진 첨부 (최대 3장, 20MB, S3 업로드)
  - **교환 시 옵션 선택 드롭다운**: getProductDetail로 optionGroups[0].values 조회, 재고 표시, 품절 disabled
  - 제출 성공 시 invalidateOrderRelated 후 /mypage/orders 이동
- **마이페이지 주문내역 버튼 분기**:
  - returnRequested === true → "반품 신청완료" (회색 텍스트, 버튼 아님)
  - exchangeRequested === true → "교환 신청완료"
  - REFUNDED → "환불완료"
  - DELIVERED + 미확정 + 신청 없음 → 구매확정/반품요청/교환요청 3버튼
  - DELIVERED + 확정됨 → 리뷰 작성
  - OrderStatus RETURN_REQUESTED/EXCHANGE_REQUESTED → 주황색 뱃지
- **관리자 페이지**: `admin/requests/page.tsx`
  - 5탭 필터 (전체/신청완료/승인/거절/처리완료)
  - 가로 스크롤 테이블 (주문번호/유형/사유/희망옵션/상태/신청일/관리)
  - 행 클릭 시 펼침 — 상세 사유, 이미지 썸네일, 관리자 메모, 희망 교환 옵션 (굵게)
  - 승인/거절 모달 (거절 시 메모 필수)
  - 처리완료 모달 (재고 복구 안내)
- **lib/order.ts**: createReturnExchangeRequest, getReturnExchangeRequests, uploadReturnImage
- **lib/admin.ts**: getAdminRequests, approveRequest, rejectRequest, completeRequest

## React Query 캐시 전략 (queryInvalidator)

- **lib/queryInvalidator.ts**: 도메인별 무효화 헬퍼 함수 모음
  - invalidateOrderRelated: orders/order/admin orders/admin requests
  - invalidateProductRelated: products/product/admin products/main 목록/검색
  - invalidateCartRelated, invalidateWishlistRelated, invalidateCouponRelated
  - invalidateBannerRelated, invalidateReviewRelated, invalidateAddressRelated, invalidateUserRelated
  - invalidateAfterPayment: 결제 완료 시 4개 도메인 일괄 갱신
- **운영 원칙**:
  - 모든 mutation의 onSuccess에서 도메인 헬퍼 호출
  - 쿼리 키는 도메인 prefix 통일 (예: ["orders", page], ["product", id])
  - 새 쿼리 추가 시 헬퍼만 업데이트하면 모든 mutation에 자동 반영
  - cross-invalidation: admin mutation 시 user 캐시도 함께 무효화 (예: admin/orders 상태 변경 시 user mypage 캐시도 갱신)
- **staleTime 튜닝**:
  - 실시간 중요 (mypage/orders, admin/orders, admin/requests): 0
  - 일반 (전역 기본값): 60초
  - 거의 안 바뀜 (categories): 5분
- **mypage/wishlist**: 이 페이지에서만 mutation 후 invalidate 안 함 (즉시 카드 사라지는 것을 막기 위해 toggledOff 로컬 상태로 하트 색상만 전환, 새로고침 시 사라짐)

## Backend Config

- `application-example.yml` 존재 (GitHub 공유용, 민감 키 제외)

## Known Issues

- 소셜 로그인: 쇼핑몰 사업자 정보 확정 후 진행 예정
- 토스 환불 API: 미연동
- 회원가입 약관: 현재 플레이스홀더, 실제 약관 내용 교체 예정

## Next Up

- **상품 수정 페이지 분리**: 현재 모달 방식 → `/admin/products/{id}/edit` 별도 페이지로 이동
  - 2컬럼 레이아웃: 좌측(기본 정보), 우측(옵션 관리 + 이미지 관리)
  - 이미지 추가/삭제/순서 변경 포함
  - 관리자 목록 "수정" 버튼 클릭 시 모달 대신 페이지 라우팅
  - 백엔드 `GET /api/admin/products/{id}` 단건 조회 API 신규 필요 (현재 미존재, 목록·상세 공개 API 재활용 여부 검토)
- 소셜 로그인 (사업자 정보 확정 후)
- 3단계: Elasticsearch, Kafka, CI/CD, 배포

## Recent Changes (2026-04-09)

- **상품 옵션 수정 UI**: admin/products/page.tsx 수정 모달에 옵션 편집 섹션 추가 (백엔드 PATCH 옵션 수정 API 연동). `AdminProductOptionUpdate` 타입 신규
- **상품 등록 옵션 UI 전면 개편**: admin/products/new/page.tsx — 사이즈/색상 라디오('없음'/'직접 설정') + 기본값 토글 버튼 + 직접 입력 + 자동 조합 생성
- **상품 상세 옵션 드롭다운**: ProductDetailClient.tsx — 버튼 나열 → 색상/사이즈 드롭다운 전환, FREE/조합형/단일 옵션 자동 분기, 색상 → 사이즈 순서, 외부 클릭 닫기
- **재고 초과 방지**: 상품 상세 수량 컨트롤 + "(N개 남음)" 인라인 표시, 장바구니 over-stock 항목 grayscale 처리 + 체크박스/주문 차단, 수량 감소 항상 허용
- **편의성**: 관리자 옵션 재고 input `onFocus select()` 적용 (0이 안 지워지고 "10"이 되는 버그 해결)
