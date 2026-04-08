# 쇼핑몰 프론트엔드 작업 요약 — v5 (0408)

## 프로젝트 기본 정보
- 프로젝트: shopify-clone (의류 쇼핑몰, 취업 포트폴리오 + 실서비스 목표)
- 경로: `C:\Users\KYW\projects\shopify-clone`
- GitHub: https://github.com/yongddak2/shopify-clone (Public)
- 백엔드: Spring Boot 4, Java 17 (localhost:8080)
- 프론트엔드: Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4 (localhost:3000)
- 터미널: cmd 기준 (PowerShell 아님)
- 개발 도구: Cursor (루트 폴더 오픈) + Claude Code (우측 상단 아이콘)

---

## 완료 요약 (0402~0404)
헤더 리디자인, 다크 테마, 관리자 페이지 전체, 카카오 우편번호, 토스 결제, 할인가 표시, 조합형 옵션, 장바구니 선택결제, S3 이미지 업로드, 마이페이지 전체, 찜 버튼, 리뷰 시스템 고도화, 검색 기능, 메인 페이지 API 연동, 배너 슬라이더, 비밀번호 변경, 쿠폰 실적용, 결제 완료 페이지, 주문 상태 한글화

---

## 완료한 작업 (0408)

### 구매 확정 API 연동
- mypage/orders/page.tsx: localStorage 완전 제거 → confirmOrder(id) API 호출
- 구매 확정 여부: confirmedIds.has() → order.confirmedAt !== null
- confirmMutation 추가 (React Query useMutation)
- mypage/reviews/page.tsx: localStorage 제거 → confirmedAt !== null로 교체
- lib/order.ts: confirmOrder(id) 함수 추가
- types/index.ts: OrderResponse.confirmedAt: string | null 추가

### 회원가입 약관 동의 UI
- signup/page.tsx 수정
- 전체 동의 체크박스 + 구분선
- [필수] 이용약관 동의 + 보기 버튼
- [필수] 개인정보 수집 및 이용 동의 + 보기 버튼
- [선택] 마케팅 정보 수신 동의 + 보기 버튼
- 커스텀 체크박스 (sr-only + Check 아이콘)
- 약관 모달: 스크롤, X/배경클릭/확인으로 닫기
- 필수 미동의 시 가입 버튼 disabled + 인라인 에러
- 약관 내용은 플레이스홀더 ([서비스명], [사업자명] 등), 추후 교체 예정

### 쿠폰 다운로드 UI
- mypage/coupons/page.tsx 상단에 "다운로드 가능한 쿠폰" 섹션 추가
- 버튼 3종: 다운로드 / 다운로드 완료(비활성) / 마감(비활성)
- 성공 시 myCoupons + availableCoupons 둘 다 invalidate
- 0개면 섹션 숨김, border-t 구분선으로 보유 쿠폰과 분리
- lib/coupon.ts: getAvailableCoupons(), issueCoupon() 추가
- types/index.ts: CouponListItem 타입 추가

### 관리자 쿠폰 수정/삭제
- admin/coupons/page.tsx: 관리 컬럼 추가
- 수정: 인라인 폼 (쿠폰명/총수량/시작일/종료일, 할인타입·금액 읽기 전용)
- 삭제: 확인 모달, 실패 시 에러 alert
- lib/admin.ts: updateCoupon(), deleteCoupon() 추가

### 비밀번호 찾기
- app/forgot-password/page.tsx 신규 생성
  - Step 1: 이메일 입력 + 발송
  - Step 2: 3분 타이머 + 인증번호 입력 + 재발송(30초 쿨타임)
  - Step 3: 새 비밀번호 + 실시간 유효성 (8자/영문/숫자/특수문자/일치)
  - 성공 시 /login 이동
- app/login/page.tsx: "비밀번호를 잊으셨나요?" 링크 추가
- lib/auth.ts: sendResetCode(), verifyResetCode(), resetPassword() 추가

---

## 프론트엔드 구조 (전체)

```
src/app/
├── page.tsx                        ← 배너 슬라이더 + NEW ARRIVALS + BEST
├── login/page.tsx                  ← + "비밀번호를 잊으셨나요?" 링크
├── signup/page.tsx                 ← + 약관 동의 UI
├── forgot-password/page.tsx        ← 비밀번호 찾기 3단계 (신규)
├── search/page.tsx                 ← 검색 결과
├── products/
│   ├── page.tsx                    ← 상품 목록 + 찜 하트
│   └── [id]/
│       ├── page.tsx
│       ├── ProductDetailClient.tsx
│       └── ReviewSection.tsx       ← 리뷰 섹션
├── cart/page.tsx
├── order/page.tsx                  ← 쿠폰 적용
├── payment/
│   ├── success/page.tsx            ← 결제 완료 UI
│   └── fail/page.tsx
├── orders/
├── mypage/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── orders/
│   │   ├── page.tsx                ← confirmedAt 기반, localStorage 제거
│   │   └── [id]/
│   ├── addresses/
│   ├── wishlist/
│   ├── coupons/page.tsx            ← 다운로드 가능 쿠폰 섹션 추가
│   ├── reviews/page.tsx            ← confirmedAt 기반, localStorage 제거
│   └── profile/page.tsx
└── admin/
    ├── layout.tsx
    ├── page.tsx
    ├── products/
    ├── orders/page.tsx
    ├── users/page.tsx
    ├── coupons/page.tsx            ← 수정/삭제 추가
    └── banners/page.tsx

src/lib/
├── api.ts
├── auth.ts         ← + sendResetCode, verifyResetCode, resetPassword
├── product.ts      ← + searchProducts
├── cart.ts
├── order.ts        ← + confirmOrder
├── user.ts
├── payment.ts
├── admin.ts        ← + updateCoupon, deleteCoupon
├── wishlist.ts
├── coupon.ts       ← + getAvailableCoupons, issueCoupon
└── review.ts

src/types/index.ts  ← + confirmedAt, CouponListItem
```

---

## 다음 할 작업

1. **반품/교환 요청 API** — 버튼만 있고 미구현
2. **소셜 로그인** — 쇼핑몰 사업자 정보 확정 후
3. **Race Condition 처리** — 재고 비관적 락
4. **상품 옵션 수정 API**
5. **3단계** (Elasticsearch, Kafka, CI/CD, 배포)

---

## 알려진 이슈 / 미완료
- 레거시 옵션: 삭제 후 조합형 재등록
- 결제위젯: 사업자등록 후 전환
- 반품/교환: 버튼만 존재, API 미구현
- 소셜 로그인: 사업자 정보 확정 후
- 토스 환불: 미연동
- 이용약관 실제 내용: 플레이스홀더, 사업자 정보 확정 후 교체
- 라이트 테마: 나중에

---

## 테스트 계정
```
관리자: test2@test.com / rladyddn00! (ADMIN)
일반: test@test.com / Test1234! (USER)
```
