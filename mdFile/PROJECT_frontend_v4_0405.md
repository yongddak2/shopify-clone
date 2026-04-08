# 쇼핑몰 프론트엔드 작업 요약 — v4 (0404)

## 프로젝트 기본 정보
- 프로젝트: shopify-clone (의류 쇼핑몰, 취업 포트폴리오 + 실서비스 목표)
- 경로: `C:\Users\KYW\projects\shopify-clone`
- GitHub: https://github.com/yongddak2/shopify-clone (Public)
- 백엔드: Spring Boot 4, Java 17 (localhost:8080)
- 프론트엔드: Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4 (localhost:3000)
- 터미널: cmd 기준 (PowerShell 아님)

---

## 완료 요약 (0402~0404 오전)
헤더 리디자인(햄버거→사이드바, 검색바 UI, 로그아웃 모달, ADMIN 메뉴), 다크 테마(#2a2a2a/#1e1e1e), 관리자 페이지 전체(대시보드/상품/주문/회원/쿠폰), 카카오 우편번호 API, 주문 페이지 UI(배송 메모, 배송지 모달 무신사 스타일), 토스페이먼츠 결제창(API 개별 연동), 할인가 표시(basePrice×(1-discountRate/100)+additionalPrice), 조합형 옵션(사이즈×색상→단일 optionGroup), 상품 등록 복구, 장바구니 체크박스 선택결제(sessionStorage), 장바구니 담기 커스텀 모달, S3 이미지 업로드(최대 5장, 대표 뱃지), 썸네일 표시(thumbnailUrl), 마이페이지 전체(주문내역 5탭+기간필터+액션버튼, 주문 상세+썸네일+링크, 배송지 관리 인라인+10개제한, 찜 목록+하트토글, 쿠폰함 3탭, 리뷰 관리+구매확정 연동, 프로필+탈퇴), 상품 목록/상세 찜 하트 버튼, lib/wishlist·coupon·review·user 추가

---

## 완료한 작업 (0404 오후~야간) — 이번 대화

### 상품 상세 리뷰 UI
- ReviewSection.tsx 신규 (ProductDetailClient.tsx 하단 삽입)
- 리뷰 요약 헤더 (총 N개 + 평균 별점)
- 정렬 드롭다운 (최신순/별점높은순/별점낮은순/추천순)
- 리뷰 카드: 작성자 마스킹, 별점(★), 구매옵션(optionInfo), 내용, 이미지 썸네일(80x80)
- 이미지 모달: 원본 + 좌우 화살표
- 좋아요 토글: 로그인만, 낙관적 업데이트
- 페이지네이션: 최대 5개 + ... + 이전/다음
- 빈 상태: "아직 리뷰가 없습니다."

### 마이페이지 리뷰 모달 방식 변경
- 인라인 확장 → 모달로 전면 변경
- 모달: 상품 정보 + 별점(필수, hover 미리보기) + 내용 + 사진 첨부(S3, 최대 10장, 10MB)
- 수정: 기존 내용 채워진 모달, 제출 시에만 삭제→재작성
- 삭제: 확인 모달 후 DELETE
- 완료 상품: "리뷰 작성 완료" 녹색 + 수정/삭제 버튼
- 상품명 → /products/{id} 링크
- 주문내역에서도 리뷰 완료 표시 (회색)

### 검색 기능 연결
- 헤더 검색바: Enter → /search?keyword=xxx 이동
- /search 페이지: 상단 필터바(카테고리 드롭다운 + 가격 범위 + 초기화 + 정렬), 상품 그리드, 페이지네이션
- lib/product.ts에 searchProducts() 추가

### 메인 페이지 API 연동
- 하드코딩 → "use client" + API 연동
- NEW ARRIVALS (최신순 8개) + BEST (판매량순 8개)
- "더보기 >" → /products?sort=xxx
- products/page.tsx: URL sort 파라미터 읽기 + "판매량순" 추가

### 배너 슬라이더 + 관리자 배너 관리
- BannerSlider: fade 트랜지션 (클론→버그→전면 재작성), isTransitioning 잠금(700ms)
- 자동 4초, hover 일시정지, 50vh/80vh, max-h-[800px]
- 오버레이: "SHOPIFY" + "Find Your Style" + rounded-full "SHOP NOW"
- 0개→히어로 폴백, 1개→화살표 숨김
- /admin/banners: 목록(N/5), ▲▼ 순서, 토글 스위치, 삭제(모달), S3 업로드
- 사이드바에 "배너관리" 메뉴 추가

### 비밀번호 변경
- "준비 중" → 실제 기능 교체
- 현재/새/확인 input + 눈 아이콘(tabIndex={-1})
- 실시간 유효성: 4조건 표시 + 일치/불일치
- 30일 제한 + 마지막 변경일 표시
- 변경 성공 후 즉시 refetch

### 전화번호 포맷팅
- 회원가입 + 프로필: 숫자만 + 자동 하이픈 + 최대 11자리 + 전송 시 제거

### 쿠폰 실적용 UI
- 주문 페이지: 쿠폰 드롭다운 (사용 가능 필터), 할인 실시간 계산, "쿠폰 할인: -N원" 빨간색
- createOrder()에 memberCouponId 전달
- 주문 상세: "쿠폰 할인 (쿠폰명)" 표시
- 쿠폰함: usedAt 기반 사용완료 판별 수정

### 결제 완료 페이지
- ✓ 아이콘 + "주문이 완료되었습니다!" + 주문번호 + 결제금액
- "쇼핑 계속하기" → /, "주문 상세 보기" → /mypage/orders
- sessionStorage 정리 + invalidateQueries(["cart"])
- 결제하기→장바구니 튕기는 버그 수정 (invalidateQueries 시점 이동)

### 주문 상태 한글화
- PENDING→주문대기, PAID→결제완료, PREPARING→배송준비중, SHIPPED→배송중, DELIVERED→배송완료, CANCELLED→주문취소, REFUNDED→환불완료
- 마이페이지: 색상 통일 (회색)
- 관리자: 한글 + 기존 색상 유지

### 주문내역 금액 정리
- 상품별 가격 제거 + "결제 금액: N원" 1줄
- 쿠폰 뱃지 제거 (상세에서만)
- 주문 상세 PAYMENT: 할인 시 ~~원가~~ 할인가 표시

### 기타
- 로그아웃 → window.location.href = "/" (무한 로딩 수정)
- 관리자 테이블 가로 스크롤 (orders 900px, products 1000px, users 750px, coupons 850px)

---

## 프론트엔드 구조 (핵심 변경 파일만)

```
src/app/
├── page.tsx                    ← 배너 슬라이더 + NEW ARRIVALS + BEST
├── search/page.tsx             ← 검색 결과 (신규)
├── signup/page.tsx             ← 전화번호 하이픈
├── products/[id]/ReviewSection.tsx ← 리뷰 섹션 (신규)
├── order/page.tsx              ← 쿠폰 적용 추가
├── payment/success/page.tsx    ← 결제 완료 UI
├── mypage/reviews/page.tsx     ← 모달 방식 리뷰
├── mypage/orders/page.tsx      ← 한글화, 금액 정리
├── mypage/profile/page.tsx     ← 비밀번호 변경, 전화번호 하이픈
├── mypage/coupons/page.tsx     ← usedAt 기반 판별
├── admin/banners/page.tsx      ← 배너 관리 (신규)
└── admin/orders/page.tsx       ← 한글화 + 색상 유지

src/lib/
├── product.ts    ← + searchProducts()
├── review.ts     ← + getMyReviews(), uploadReviewImage(), toggleReviewLike()
├── user.ts       ← + changePassword()
├── payment.ts    ← orderNumber 기반
└── admin.ts      ← + 배너 CRUD 6개, getPublicBanners()

src/types/index.ts ← + ReviewPage, ReviewLikeResponse, Banner, coupon/password 필드
```

---

## 다음 할 작업

1. **구매 확정 API** — localStorage → 백엔드
2. **소셜 로그인** — 카카오/구글
3. **이용약관 + 약관 동의** — 법적 필수
4. **3단계** (Elasticsearch, Kafka, CI/CD, 배포)

---

## 알려진 이슈 / 미완료
- 레거시 옵션: 삭제 후 조합형 재등록
- 결제위젯: 사업자등록 후 전환
- 쿠폰 다운로드 UI: curl만 가능
- 구매 확정: localStorage (백엔드 없음)
- 반품/교환: 버튼만 존재
- 비밀번호 찾기: 이메일 인증 필요
- 토스 환불: 미연동
- 이용약관: 미구현
- 라이트 테마: 나중에

---

## 테스트 계정
```
관리자: test2@test.com / rladyddn00! (ADMIN)
일반: test@test.com / Test1234! (USER)
```
