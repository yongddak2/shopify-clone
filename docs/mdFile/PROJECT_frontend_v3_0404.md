# 쇼핑몰 프론트엔드 작업 요약 — v3 (0404)

## 프로젝트 기본 정보
- 프로젝트: shopify-clone (의류 쇼핑몰, 취업 포트폴리오 + 실서비스 목표)
- 경로: `C:\Users\KYW\projects\shopify-clone`
- GitHub: https://github.com/yongddak2/shopify-clone (Public)
- 백엔드: Spring Boot 4, Java 17 (localhost:8080)
- 프론트엔드: Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4 (localhost:3000)
- 개발 수준: Spring Boot 입문, 초보자 기준 설명 필요
- 터미널: cmd 기준 (PowerShell 아님)
- Claude Code 백엔드: `cd backend` → `claude`
- Claude Code 프론트엔드: `cd frontend` → `claude`

---

## 완료한 작업 (0402 이전)

### 헤더 리디자인
- 데스크톱/모바일 모두 왼쪽 햄버거 아이콘 → 왼쪽 슬라이드 사이드바 패널 (SHOP 메뉴 포함)
- 중앙 SHOPIFY 로고 (클릭 시 홈 이동, 나중에 이미지 교체 가능)
- 오른쪽: 검색(🔍) + Login/Join 또는 LOGOUT + 쇼핑백(🛍️) + 마이페이지(👤)
- 비로그인 시에도 쇼핑백/마이페이지 아이콘 표시 (클릭 → /login)
- 검색바: 헤더 아래 레이어드 슬라이드 다운 (UI만, 기능 미연결)
- 로그아웃: 커스텀 확인 모달 후 실행
- ADMIN 사용자일 때 사이드바에 "관리자" 메뉴 표시 (조건부 렌더링, DOM에 미존재)

### 다크 테마 전체 적용
- 차콜 다크 테마: 배경 #2a2a2a, 헤더/푸터 #1e1e1e
- globals.css에 CSS 변수 체계로 정의
- 모든 페이지 적용 완료

### 관리자 페이지 전체 구현 (/admin)
- 별도 레이아웃 (240px 사이드바 + 콘텐츠, 일반 Header/Footer 미사용)
- 권한 체크: 비로그인 → /login, ADMIN 아님 → 리다이렉트
- 대시보드, 상품 관리, 주문 관리, 회원 관리, 쿠폰 관리

### 백엔드 수정 (이전 대화에서)
- AdminProductCreateRequest.java: optionValues 키 불일치 수정
- AdminProductService.java: getValues() → getOptionValues()

---

## 완료한 작업 (0403)

### 쿠폰 관리 버그 수정
- 백엔드 CouponResponse DTO에 totalQuantity, issuedQuantity 필드 추가
- 프론트엔드 쿠폰 관리 페이지에서 발급/총수량 정상 표시

### console.log 제거 + 관리자 사이드바 링크
- products/new/page.tsx 디버그 로그 삭제
- Header.tsx 사이드바에 ADMIN 전용 "관리자" 메뉴 추가 (조건부 렌더링)

### GitHub 업로드
- 프로젝트 전체 GitHub에 push
- application-example.yml 생성 (민감 키 제외, GitHub 공유용)
- .gitignore에 application.yml 추가

### 카카오 우편번호 API 연동
- 주문 페이지에 카카오 Postcode 스크립트 로드 (next/script)
- 우편번호 + 기본주소: 검색으로만 입력 (readOnly)
- 상세주소: 직접 입력
- 배송지 관리 모달 안에서도 동작

### 주문 페이지 UI 대폭 개선
- 섹션 제목 한글화 (주문상품, 배송 정보, 결제 정보)
- 필수 입력 필드에 빨간 * 표시
- 배송 메모 드롭다운 (5개 프리셋 + 직접입력)
- 배송지 관리 모달 (무신사 스타일):
  - 배송지 목록 모달: 라디오 선택, 수정/삭제, 배송지 이름(label) 표시
  - 배송지 추가/수정 모달: 카카오 우편번호, 기본 배송지 설정, 연락처 자동 하이픈
  - 선택한 배송지를 읽기 전용 카드로 표시 + "배송지 변경" 버튼

### 토스페이먼츠 결제창 연동
- API 개별 연동 키 사용 (결제위젯 키는 사업자등록 후 발급 예정)
- 주문 생성 → 토스 SDK requestPayment() → /payment/success → confirm API
- payment/success, payment/fail 페이지 생성
- lib/payment.ts 생성 (confirmPayment 함수)
- 환경변수: NEXT_PUBLIC_TOSS_CLIENT_KEY

### 할인가 표시 버그 수정
- 백엔드 CartItemResponse DTO에 discountRate 필드 추가
- 장바구니: 원가 취소선 + 할인가 표시
- 주문 페이지: 할인 적용된 금액으로 계산
- 할인가 계산: basePrice × (1 - discountRate / 100) + additionalPrice

### 조합형 옵션 구조 변경
- 상품 등록: 사이즈×색상 조합을 하나의 optionGroup("옵션")으로 전송
- 상품 상세: 조합형이면 "S-블랙", "M-블랙" 등 버튼으로 나열
- 기존 분리형 옵션(레거시) 하위 호환 유지
- 색상 커스텀 추가 기능 ("+ 색상 추가" 버튼, 여러 개 가능)
- 추가가격 컬럼 제거 (항상 0으로 전송)

### 상품 등록 페이지 복구 + 개선
- admin/products/new/page.tsx 파일 유실 → 새로 생성
- 등록 후 목록 즉시 갱신 (React Query invalidateQueries)
- 재고수량 input: focus 시 0 자동 제거, blur 시 빈칸이면 0 복구

### 장바구니 체크박스 선택 결제
- 전체 선택/해제 체크박스 + 선택된 개수 표시
- 기본값: 아무것도 체크 안 된 상태
- 체크된 상품만 기준으로 가격 계산
- 체크 없으면 "상품을 선택해주세요" 버튼 비활성화
- 선택 삭제 기능 (확인 모달 후 일괄 삭제)
- 선택한 상품의 cartItemId를 sessionStorage로 주문 페이지에 전달
- "쇼핑 계속하기" 버튼 추가

### 장바구니 담기 모달 개선
- 브라우저 confirm() → 커스텀 다크 테마 모달로 교체
- "장바구니에 담았습니다." + "쇼핑 계속하기" / "장바구니로 이동" 버튼

### lib/user.ts API 함수 추가
- addMyAddress (POST /api/users/me/addresses)
- updateMyAddress (PATCH /api/users/me/addresses/{id})
- deleteMyAddress (DELETE /api/users/me/addresses/{id})

---

## 완료한 작업 (0404)

### AWS S3 이미지 업로드
- 상품 등록 페이지: URL 직접 입력 → 파일 선택 업로드로 변경
- 파일 선택 즉시 S3 업로드, 업로드 중 animate-pulse 로딩 표시
- 100x100 썸네일 미리보기 + X 삭제 버튼 (S3에서도 삭제)
- 첫 번째 이미지에 "대표" 뱃지
- 점선 테두리 "+" 버튼으로 추가 (최대 5장)
- 유효성: 확장자(jpg/jpeg/png/gif/webp), 5MB 제한
- lib/admin.ts에 uploadProductImage, deleteProductImage 함수 추가

### 썸네일 표시 수정
- Product 타입에 thumbnailUrl: string | null 추가
- 상품 목록(products/page.tsx): product.thumbnailUrl 직접 사용으로 변경
- OrderItemResponse에 thumbnailUrl 추가

### 마이페이지 전체 구현 (/mypage)
- **레이아웃 (layout.tsx)**: 왼쪽 사이드 메뉴(200px) + 콘텐츠, 모바일 가로 탭 전환, 비로그인 시 /login 리다이렉트
- **대시보드**: 사용자 이름 + 배송중/배송완료/쿠폰/찜 요약 카드 4개 (클릭 시 해당 탭으로 이동)
- **page.tsx**: /mypage 접속 시 /mypage/orders로 리다이렉트
- Header.tsx: 👤 아이콘 → /mypage로 변경

### 마이페이지 — 주문내역 (/mypage/orders)
- 상태별 탭 5개: 전체 / 주문·결제(PENDING+PAID) / 배송중(PREPARING+SHIPPED) / 배송완료(DELIVERED) / 취소·환불(CANCELLED+REFUNDED)
- 각 탭에 건수 표시
- 기간 필터: 배송완료 탭에서만 표시 (최근 1주/1개월/3개월/6개월/전체)
- 주문 카드: 날짜(26.04.03(금) 형식, 요일 포함) + 주문번호 + 상태 뱃지(색상 구분) + 주문 상세 링크
- 각 주문 아이템 개별 표시 (60x60 썸네일 + 상품명 + 옵션 + 수량 + 가격)
- 상태별 액션 버튼:
  - PENDING/PAID: 주문 취소(확인 모달) | 옵션 변경(준비 중 alert)
  - DELIVERED 구매확정 전: 구매 확정 | 반품 요청(준비 중) | 교환 요청(준비 중)
  - DELIVERED 구매확정 후: 리뷰 작성
- 구매확정 상태: localStorage confirmedOrderIds로 관리
- URL 쿼리 파라미터로 탭 전환 (?tab=shipping, ?tab=delivered)

### 마이페이지 — 주문 상세 (/mypage/orders/[id])
- 주문 상품에 60x60 썸네일 표시
- 상품명 클릭 → /products/{productId} 이동 (하이퍼링크)
- DELIVERY INFO에 배송상태 표시 (상태별 색상)
- 주문 취소 버튼 (PENDING/PAID)
- "← 목록" 뒤로가기 버튼

### 마이페이지 — 배송지 관리 (/mypage/addresses)
- 배송지 목록 + 추가/수정/삭제
- 수정: 해당 항목 자리에서 인라인 폼 오픈, 기존 값 자동 채움
- 카카오 우편번호 API 연동 (next/script lazyOnload)
- 기본 배송지 뱃지 + 변경 시 확인 모달
- 중복 주소 등록 방지 (zipcode + address + addressDetail 조합 체크)
- 최대 10개 제한 (현재 개수/10 표시, 초과 시 추가 버튼 비활성화)

### 마이페이지 — 찜 목록 (/mypage/wishlist)
- 찜 상품 그리드 표시 (썸네일, 상품명, 가격, 할인 표시)
- 하트(♥) 클릭으로 찜 해제
- "장바구니 담기" 버튼 → /products/{productId} 이동 (옵션 선택 필요)
- 찜한 날짜 표시 (26.04.03 찜)
- 상단에 찜한 상품 개수 표시 (예: "찜 목록 (3)")

### 마이페이지 — 쿠폰함 (/mypage/coupons)
- 탭 3개: 사용가능 / 사용완료 / 만료 (각 탭 건수 표시)
- 사용가능: usedAt null + 만료일 미경과
- 사용완료: usedAt 존재
- 만료: usedAt null + 만료일 경과
- 할인 내용 (FIXED/PERCENT), 최소 주문 금액, 유효기간
- 사용완료/만료 쿠폰 흐리게 처리

### 마이페이지 — 리뷰 관리 (/mypage/reviews)
- DELIVERED 주문의 orderItems 표시
- 구매확정된 상품만 리뷰 작성 가능 (localStorage confirmedOrderIds 참조)
- 구매확정 안 된 상품은 "구매 확정 후 리뷰 작성 가능" 흐리게 표시
- 인라인 리뷰 작성 폼 (별점 1~5 + 내용 textarea)
- 작성 완료 시 "리뷰 작성완료" 뱃지

### 마이페이지 — 회원정보 수정 (/mypage/profile)
- GET /api/users/me로 현재 정보 조회
- 이메일 읽기 전용, 이름/전화번호 수정 (PATCH /api/users/me)
- 비밀번호 변경: "준비 중" 표시 (백엔드 API 미존재)
- 회원 탈퇴: 확인 모달 → DELETE /api/users/me → 로그아웃 → 메인 이동 (빨간색 계열 버튼, 최하단)

### 상품 목록 찜 하트 버튼
- /products 페이지 각 상품 이미지 우하단에 하트 버튼
- 로그인 시: GET /api/wishlists로 찜 목록 조회, Set으로 productId 관리
- 찜 여부에 따라 빈 하트(♡)/채워진 하트(♥) 토글
- 비로그인 시: alert("로그인이 필요한 서비스입니다") + /login 이동
- e.preventDefault() + e.stopPropagation()으로 카드 Link 이동 방지

### 상품 상세 찜 버튼
- ProductDetailClient.tsx에 하트 버튼 추가
- 로그인 시: 찜 여부 확인 → 토글
- 비로그인 시: /login 이동

### 신규 lib 파일
- lib/wishlist.ts: getWishlists(), toggleWishlist(productId)
- lib/coupon.ts: getMyCoupons()
- lib/review.ts: getProductReviews(), createReview(), deleteReview()

### types/index.ts 타입 추가
- Product.thumbnailUrl: string | null
- OrderItemResponse.thumbnailUrl: string | null
- WishlistItem (id, productId, productName, productPrice, thumbnailUrl, createdAt)
- MemberCoupon (백엔드 MemberCouponResponse 구조 일치)
- Review (백엔드 ReviewResponse 구조 일치)

---

## 다음 할 작업

### 우선순위 순
1. **리뷰 UI** — 상품 상세 페이지에서 리뷰 보기
2. **소셜 로그인** — 카카오/구글 (API 키 발급 후)
3. **검색 기능 연결** — 현재 UI만 존재
4. **쿠폰 실적용** — 주문 시 쿠폰 할인 반영
5. **메인 페이지 API 연동** — 하드코딩 더미 → 실제 상품
6. **비밀번호 찾기/변경**
7. **프론트엔드 디자인 수정** — 관리자 요구사항 대기 중

### 3단계 기능
- Elasticsearch 검색 고도화
- Kafka 비동기 처리
- Prometheus/Grafana 모니터링
- CI/CD
- 클라우드 배포

---

## 알려진 이슈 / 미완료 항목
- 레거시 옵션 상품: 삭제 후 조합형으로 재등록 필요
- 결제위젯 전환: 사업자등록 후 키 발급 시 프론트 결제 호출만 수정
- 검색바: UI만 구현, 기능 미연결
- 쿠폰 주문 적용: 미리보기만 구현
- 재고 Race Condition: 비관적 락 미적용
- 백엔드 PATCH /api/admin/products/{id}: 옵션 수정 미지원
- 구매 확정: 프론트 localStorage 관리 (백엔드 API 없음)
- 반품/교환: 프론트 버튼만 존재 (백엔드 API 없음)
- 비밀번호 변경: 프론트 "준비 중" (백엔드 API 없음)
- 토스 환불: 미연동
- 메인 페이지: 하드코딩 더미 데이터
- 상품 상세 리뷰 UI: 백엔드 완료, 프론트 미구현
- 라이트 테마: 나중에 추가 예정

---

## 참고 사항
- 테스트 계정: test2@test.com / Test1234! (ADMIN)
- 일반 계정: test@test.com / Test1234! (USER)
- 서버 실행: Docker Desktop → docker compose up -d → backend: gradlew bootRun → frontend: npm run dev
- 백엔드 확인: http://localhost:8080/swagger-ui.html
- 레퍼런스 사이트: coolsis.kr, kaposhka.com, hieta.co.kr (미니멀 의류 쇼핑몰)
- 코드 작성은 Claude Code에서, 웹 채팅(여기)에서는 설계/방향 결정
- 프롬프트는 여기서 작성 → Claude Code에 붙여넣기 방식
- Git 커밋은 의미 있는 작업 단위로 직접 타이밍 결정
