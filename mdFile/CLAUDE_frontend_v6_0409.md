# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Shopify Clone frontend — 의류 쇼핑몰 프론트엔드. Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4.
백엔드(Spring Boot, localhost:8080)와 통신.

## Commands

```bash
npm run dev      # 개발 서버 (포트 3000)
npm run build    # 프로덕션 빌드
npx tsc --noEmit # 타입 체크
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
├── app/
│   ├── layout.tsx          # 루트 레이아웃 (Header/Footer/Providers)
│   ├── page.tsx            # 메인 (배너 슬라이더 + NEW ARRIVALS + BEST)
│   ├── login/, signup/     # 인증 (signup: 약관 3종 동의)
│   ├── forgot-password/    # 비밀번호 찾기 (3단계 스텝)
│   ├── products/           # 상품 목록 + 상세 (ReviewSection 포함)
│   ├── search/             # 검색 결과 (키워드/카테고리/가격 필터)
│   ├── cart/               # 장바구니 (재고 초과 처리 포함)
│   ├── order/              # 주문 (쿠폰 적용, 카카오 주소 API)
│   ├── orders/             # 주문 내역
│   ├── payment/            # 결제 성공/실패
│   ├── mypage/
│   │   ├── layout.tsx      # 사이드메뉴 + 대시보드 카드 + 모바일 탭
│   │   ├── orders/         # 주문내역 (5탭 + 반품/교환/구매확정/리뷰 액션)
│   │   │   └── [id]/return-exchange/  # 반품/교환 신청 (?type=RETURN|EXCHANGE)
│   │   ├── addresses/      # 배송지 관리 (카카오 주소 API, 10개 제한)
│   │   ├── wishlist/       # 찜 목록
│   │   ├── coupons/        # 쿠폰함 (다운로드 + 3탭)
│   │   ├── reviews/        # 리뷰 관리 (모달 방식, S3 이미지)
│   │   └── profile/        # 회원정보 + 비밀번호 변경 + 탈퇴
│   └── admin/
│       ├── layout.tsx      # 사이드바 + ADMIN 권한 체크
│       ├── products/       # 상품 목록/등록 (수정은 [id]/edit 페이지)
│       │   ├── new/        # 상품 등록 (사이즈×색상 자동 조합 UI)
│       │   └── [id]/edit/  # 상품 수정 (2컬럼: 기본정보 / 옵션+이미지)
│       ├── inventory/      # 재고 관리 (옵션별 일괄 조회/수정)
│       ├── orders/         # 주문 관리
│       ├── users/          # 회원 관리
│       ├── coupons/        # 쿠폰 관리 (CRUD)
│       ├── banners/        # 배너 관리
│       └── requests/       # 반품/교환 관리
├── lib/
│   ├── api.ts, auth.ts, product.ts, cart.ts, order.ts
│   ├── user.ts, admin.ts, wishlist.ts, coupon.ts, review.ts, payment.ts
│   └── queryInvalidator.ts  # React Query 캐시 헬퍼
├── stores/authStore.ts
└── types/index.ts
```

## Design & Theme

- 전체 다크 테마: 배경 #2a2a2a, 헤더/푸터 #1e1e1e (CSS 변수 기반)
- 헤더: 햄버거 사이드바 + 중앙 로고 + 검색바 + 로그인/로그아웃 + 쇼핑백 + 마이페이지(→/mypage)
- 관리자 페이지: 240px 사이드바, 일반 Header/Footer 미사용, 테이블 overflow-x-auto + min-w

## Code Patterns

- SSR Hydration 방지: `useState(false)` + `useEffect` mounted 패턴
- 인증 보호: 비로그인 → /login, 관리자 → role 체크
- 에러 표시: alert() 대신 빨간 인라인 텍스트
- 가격: `Math.round(basePrice * (1 - discountRate / 100)) + additionalPrice`, 천단위 콤마
- 전화번호: 숫자만 + 자동 하이픈, 전송 시 하이픈 제거
- 주문 상태 한글화: 프론트 STATUS_LABELS 매핑 (마이페이지: 색상 통일 / 관리자: 색상 뱃지 유지)

## Product Options (상품 옵션)

### 등록 (`admin/products/new`)
- 사이즈/색상 각각 라디오 (`'none' | 'custom'`)
- 기본 사이즈: S/M/L/XL/XXL/FREE, 기본 색상: 블랙/화이트/네이비/그레이/베이지/브라운/카키/버건디
- 직접 입력 추가 가능, 중복 무시
- `optionCombinations` useEffect 자동 생성:
  - 둘 다 none → `[{value:'FREE', stock:0}]` (표시: "옵션 없음")
  - size만 custom → 사이즈 단일 행
  - color만 custom → 색상 단일 행
  - 둘 다 custom → 사이즈×색상 cross product (`"S-블랙"`)
- 전송: `optionGroups: [{ name:"옵션", optionValues:[...] }]`

### 수정 (`admin/products/[id]/edit`)
- 2컬럼 레이아웃 (좌: 기본정보 / 우: 옵션관리 + 이미지관리)
- 옵션: 행 단위 옵션값/재고 수정·삭제·추가
- 이미지: **삭제 마킹 방식** (`markedForDelete`) — X 클릭 시 마킹만, 저장 시 일괄 S3+DB 동기화, 취소 시 신규 업로드만 S3 정리
- 저장 페이로드: `{ optionGroupName:"옵션", optionValues:[{id,value,additionalPrice,stockQuantity}], images:[{id,url,sortOrder,isThumbnail}] }` (id null = 신규)
- GET `/api/admin/products/{id}` 단건 조회로 초기 데이터 로딩

### 상세 페이지 드롭다운 (`products/[id]/ProductDetailClient.tsx`)
- `value === "FREE"` → 드롭다운 없이 자동 선택
- `-` 포함 → 색상/사이즈 분리 드롭다운 (색상 선택 후 사이즈 활성화)
- 그 외 → 단일 드롭다운
- stock=0 → `(품절)` + disabled, 외부 클릭 시 자동 닫힘

## Cart Stock Handling (장바구니 재고)

### 상품 상세
- `currentStock` 추적 (옵션 변경 시 quantity 1로 리셋)
- 재고 1~10개: "N개 남음" 주황 인라인 표시
- 수량 +버튼 max 제한, 직접 입력 초과 자동 클램핑
- currentStock=0: 장바구니 버튼 "품절" + disabled

### 장바구니 (`cart/page.tsx`)
- `CartItem.stockQuantity` 백엔드 제공
- 재고 초과 항목: `opacity-40 grayscale` + "재고 부족 (현재 재고: N개)" + 상단 sticky 경고 배너
- **− 버튼은 재고 초과 상태에서도 항상 활성** (수량 줄이기 허용, `quantity <= 1`만 검사)
- 체크박스: 재고 초과 항목 자동 해제+disabled, 수량 조정 후 자동 복원
- 주문하기: over-stock 체크 항목 있으면 차단

## React Query 캐시 전략 (queryInvalidator)

`lib/queryInvalidator.ts` — 도메인별 무효화 헬퍼:
- `invalidateOrderRelated`: orders/order/admin orders/admin requests
- `invalidateProductRelated`: products/product/admin products/main/search/**admin inventory**
- `invalidateCartRelated`, `invalidateWishlistRelated`, `invalidateCouponRelated`
- `invalidateBannerRelated`, `invalidateReviewRelated`, `invalidateAddressRelated`, `invalidateUserRelated`
- `invalidateAfterPayment`: 결제 완료 시 4개 도메인 일괄

**운영 원칙:**
- 모든 mutation onSuccess에서 도메인 헬퍼 호출
- 쿼리 키 도메인 prefix 통일 (`["orders", page]`, `["product", id]`)
- cross-invalidation: admin mutation 시 user 캐시도 함께 무효화

**새 페이지/쿼리 추가 시 체크리스트:**
1. 이 페이지 쿼리 키가 도메인 헬퍼에 포함됐나?
2. 관련 mutation onSuccess에 헬퍼가 호출되나?

**staleTime:**
- 실시간 (mypage/orders, admin/orders, admin/requests, admin/inventory): 0
- 일반 (전역 기본값): 60초
- 거의 안 바뀜 (categories): 5분

## Return/Exchange (반품/교환)

- **신청**: `mypage/orders/[id]/return-exchange` (?type=RETURN|EXCHANGE)
  - 사유 라디오 2그룹 (단순변심 4 / 상품·배송 문제 5), 텍스트 필수, 사진 최대 3장
  - 교환 시 원하는 옵션 드롭다운 (재고 표시, 품절 disabled)
- **주문내역 버튼 분기**:
  - returnRequested/exchangeRequested → "반품/교환 신청완료" 회색 텍스트
  - DELIVERED + 미확정 + 신청 없음 → 구매확정/반품요청/교환요청
  - DELIVERED + 확정 → 리뷰 작성
  - REFUNDED → "환불완료"
  - RETURN_REQUESTED/EXCHANGE_REQUESTED → 주황 뱃지
- **관리자**: `admin/requests` — 5탭, 승인/거절/처리완료 모달, 희망옵션 컬럼

## Admin Inventory (재고 관리)

- `/admin/inventory` — 전체 옵션 재고 한 화면 관리
- 요약 카드 4개 (전체/품절/부족/정상), 검색+상태 필터
- 인라인 재고 수정 + 즉시 저장 버튼 (변경 시에만 활성)
- GET `/api/admin/inventory`, PATCH `/api/admin/inventory/{optionValueId}`
- onSuccess: `invalidateProductRelated` (inventory 포함) 호출

## Payment (결제)

- 토스페이먼츠 API 개별 연동 (`NEXT_PUBLIC_TOSS_CLIENT_KEY`)
- 흐름: 주문 생성 → 토스 결제창 → /payment/success → POST /api/payments/confirm → 완료 UI
- **주의**: 장바구니 캐시 무효화는 payment/success에서만 (order 페이지에서 하면 빈 장바구니 감지 → 결제창 차단)

## Key API Response Notes

- 장바구니: basePrice + additionalPrice + discountRate (프론트에서 할인 계산)
- 상품 목록: `thumbnailUrl: string` 반환 (images 배열 아님)
- 주문 응답: `couponName`, `couponDiscountAmount`, `returnRequested`, `exchangeRequested`, `confirmedAt` 포함
- CartItemResponse: `stockQuantity` 포함

## Known Issues

- 소셜 로그인: 사업자 정보 확정 후 진행 예정
- 토스 환불 API: 미연동
- 회원가입 약관: 플레이스홀더, 실제 내용 교체 예정

## Next Up

- 소셜 로그인 (사업자 정보 확정 후)
- 3단계: Elasticsearch, Kafka, CI/CD, 배포
