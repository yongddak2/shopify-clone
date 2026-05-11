# VERIFICATION_LOG

검증 트랙별 실행 결과·식별 이슈·후속 리팩토링 백로그를 한 파일에 누적한다.
이슈 번호는 트랙 prefix(`AUTH-###`, `RETURN-###`, …)로 충돌을 피한다.

> 각 트랙의 "리팩토링 백로그" 섹션은 PROJECT.md "다음 작업 3번" 리팩토링 단계 진입 시 참고용 누적 목록.

---

## 권한 트랙

- 작성일: 2026-05-01
- 백엔드 버전: `f80eea5` (branch `main`)
- 환경: localhost:8080
- 테스트 계정
  - ADMIN: `test2@test.com` (id=2)
  - USER A: `authtest_a@test.com` (id=463) — 신규 회원가입
  - USER B: `authtest_b@test.com` (id=464) — 신규 회원가입
  - PROJECT.md 의 USER 계정(`test@test.com / Test1234!`)은 비밀번호 불일치로 사용 불가하여 신규 가입한 A/B 사용
- 검증 스크립트 위치: [backend/scripts/auth-test/](backend/scripts/auth-test/) — `setup.sh` + `scenario1.sh~scenario6.sh` + `README.md`. 의존성: `curl`, `node`, `bash`. 토큰 캐시: `/tmp/{admin,user_a,user_b}.tok`. ko_KR locale `grep -P` 미지원 → `LC_ALL=C.UTF-8 grep -oE` 사용.
- 환경 의존 데이터: B 주문 `B_ORDER_ID=470`, B 배송지 `B_ADDR_ID=8`, B cart `B_CART_ID=502` (다른 환경에서 재실행 시 재지정 필요)

### 검증 결과 요약

| 시나리오 | 케이스 수 | 결과 | 핵심 발견 |
|---|---|---|---|
| S1 비로그인 호출 | 30 endpoints | 모두 차단 | 응답 코드 403 + 빈 바디 (AUTH-001) |
| S2 USER → ADMIN API | 30 endpoints | 모두 403 차단 | 응답 표준 미준수 (AUTH-005) |
| S3 A 토큰으로 B 자원 접근 | 6+ endpoints | 모두 차단, 자원 데이터 비유출 | 도메인별 404/403 불일치 (AUTH-003) |
| S4 잘못된/만료 토큰 | 6 케이스 (형식 오류 / Bearer 누락 / 빈 헤더 / 다른 시크릿 서명 / 만료) | 모두 차단 | 401 대신 403 + 빈 바디 (AUTH-001) |
| S5 ADMIN 본인 차단 | 2 케이스 (role 변경 / 탈퇴) | 모두 400 차단 | 응답 코드 의미상 409 권장 (AUTH-004) |
| S6 JWT 페이로드 변조 | 3 케이스 (role / sub / 둘 다) | 모두 403 차단 | HS384 서명 검증 정상, 권한 우회 불가 |

**핵심 수치**

- 치명적 보안 이슈: **0건** — JWT 변조, USER→ADMIN 권한 우회, 사용자 간 자원 접근/정보 유출 모두 차단됨
- 경미: **4건** (AUTH-001/002/003/005)
- 개선 제안: **1건** (AUTH-004)

**비고**

- 보안 핵심(권한·소유권·서명 검증)은 의도대로 동작.
- 그러나 인증 실패 응답이 Spring Security 기본값으로 떨어져 `ApiResponse` 표준 미준수, 401/403 의미 어긋남.
- `/api/auth/refresh` 가 프론트(body 전송)와 계약 어긋남 → **자동 재발급 흐름 미작동**.
- S3에서 리뷰 DELETE 는 환경상 B 의 리뷰 생성이 어려워(DELIVERED + confirmedAt 필요) HTTP 검증 미수행. [ReviewService.java:152-158](backend/src/main/java/com/pantrka/backend/domain/review/service/ReviewService.java#L152-L158) 의 `REVIEW_NOT_OWNER` 분기로 같은 패턴 차단됨을 코드 확인.

### 이슈 목록

| 번호 | 심각도 | 증상 | 원인 | 처리 |
|---|---|---|---|---|
| **AUTH-001** | 경미 | 토큰 부재/형식오류/서명불일치/만료 모두 **403 + 빈 바디** | [SecurityConfig.java](backend/src/main/java/com/pantrka/backend/global/config/SecurityConfig.java) 에 `AuthenticationEntryPoint`/`AccessDeniedHandler` 미등록. [JwtAuthenticationFilter:31-43](backend/src/main/java/com/pantrka/backend/global/filter/JwtAuthenticationFilter.java#L31-L43) 가 무효 토큰을 SecurityContext 비운 채 통과시켜 익명 접근으로 도달 → Spring Security 기본 핸들러가 403 반환 | **이월** (백로그) |
| **AUTH-002** | 경미 (UX 관점 치명) | `/api/auth/refresh` body 전송 시 500. 프론트 자동 재발급 흐름 미작동 | [AuthController.java:40-43](backend/src/main/java/com/pantrka/backend/domain/auth/controller/AuthController.java#L40-L43) 가 `@RequestHeader("Authorization")` 로 받음. 프론트 [api.ts:36-40](frontend/src/lib/api.ts#L36-L40)·[auth.ts:77-82](frontend/src/lib/auth.ts#L77-L82) 는 body 로 전송. `MissingRequestHeaderException` → catch-all 500 | **이월** |
| **AUTH-003** | 경미 | 같은 "남의 자원" 케이스에서 도메인마다 404 vs 403 분리: 주문 GET/cancel/confirm=404, return-exchange/배송지/장바구니=403 | 주문은 [OrderService:235,251](backend/src/main/java/com/pantrka/backend/domain/order/service/OrderService.java#L235) 가 `findByIdAndMemberId` 로 조회하여 `ORDER_NOT_FOUND`. 그 외는 `findById` 후 owner 체크 → `FORBIDDEN`. 보안 유출은 없음 | **이월** (정책 결정 필요) |
| **AUTH-004** | 개선 제안 | ADMIN 본인 role 변경/탈퇴 시 응답 400 | 의미상 "잘못된 입력" 보다 "현재 자원 상태와 충돌" → 409 가 더 적절 | **이월** |
| **AUTH-005** | 개선 제안 | USER→ADMIN API 호출 시 403 차단되지만 응답 바디 빈 상태 → "권한 부족"인지 "토큰 만료"인지 구분 불가 | AUTH-001 과 동일 원인. `AccessDeniedHandler` 등록 시 함께 해결 | **이월** (AUTH-001 와 묶음) |

### 리팩토링 백로그

> 우선순위는 위에서 아래로(시급도순).

**응답 일관성 / 인증 표준화**

1. **AuthenticationEntryPoint + AccessDeniedHandler 등록** — AUTH-001 + AUTH-005 동시 해결.
   - 토큰 부재/형식오류/만료 → **401** + `ApiResponse.error("인증이 필요합니다.")`
   - 인증된 사용자의 권한 부족 → **403** + `ApiResponse.error("접근 권한이 없습니다.")`
   - JwtAuthenticationFilter 에서 토큰 검증 실패 시 사유를 request attribute 로 넘겨 EntryPoint 가 활용
   - 프론트 axios 인터셉터(`status === 401`)가 트리거되어 자동 재발급/자동 로그아웃 흐름 정상화
2. **`/api/auth/refresh` 계약을 body 기반으로 통일** — AUTH-002.
   - 컨트롤러를 `@RequestBody RefreshTokenRequest` 로 변경 (`RefreshTokenRequest` 는 이미 untracked 상태로 존재).
   - `MissingRequestHeaderException` / `HttpMessageNotReadableException` 모두 `GlobalExceptionHandler` 에서 401 또는 400 으로 매핑.
3. **사용자 간 자원 접근 응답 코드 정책 통일 — 404 통일 권장** — AUTH-003.
   - **권장: 모두 404 로 통일**하여 자원 존재 여부 숨김 (보안 우선).
   - 대안: 모두 403 으로 통일하되 메시지에 "본인 자원 아님" 포함.
   - 결정 후 OrderService / 배송지 / 장바구니 / 리뷰 / 반품/교환 일괄 정리.
4. **본인 차단 응답 코드 400 → 409 Conflict 변경** — AUTH-004. (낮은 우선순위, 정책 변경)
   - 의미상 "잘못된 입력"보다 "현재 자원 상태와 충돌"에 가까움.

**JWT/토큰 처리 강화**

5. **JWT 만료/서명오류/형식오류 구분**
   - 현재 `JwtProvider.validateToken()` 이 모든 예외를 `false` 로 통일.
   - 클라이언트가 "만료 → 재발급" vs "변조 → 즉시 로그아웃" 분기 어려움.
   - `ErrorCode.TOKEN_EXPIRED` vs `INVALID_TOKEN` 분리 필요.
6. **access vs refresh 토큰 구분용 `typ` claim 추가**
   - 현재는 Redis mismatch 로 자연 차단되지만 명시적 분리가 견고.
   - access 토큰을 refresh 엔드포인트에 보내거나 그 반대 시도 시 명확한 거절.
7. **권한 변경 즉시 반영 메커니즘**
   - 현재는 토큰 만료(30분)까지 기존 role 유지.
   - 토큰 블랙리스트 또는 `iat` 비교(권한 변경 시각 이후 토큰만 유효) 도입 검토.

**코드 구조**

8. **`LoginMember` 인증 객체 추상화**
   - 현재 `(Long) authentication.getPrincipal()` 캐스트가 모든 컨트롤러에 산재.
   - `@AuthenticationPrincipal LoginMember loginMember` 형태로 추상화하여 타입 안전성 + 가독성 향상.

> AUTH-001 + AUTH-002 두 개만 묶어 처리해도 인증 흐름 표면 품질이 크게 개선됨.

---

## 반품/교환 트랙

- 1차 실행: 2026-05-02 19:05 KST
- 2차 실행 (AUTH 트랙과는 별개의 RETURN-001/002 수정 후 재검증): 2026-05-02 19:55 KST
- 환경: Windows 11 / Git Bash / docker compose (shop-postgres healthy) / `./gradlew bootRun` 8080
- 검증 스크립트 위치: [backend/scripts/return-exchange-test/](backend/scripts/return-exchange-test/) — `setup.sh` + `_helpers.sh` + `scenario1.sh~scenario10.sh`
- 원시 로그: `run.log`(0차) / `run2.log`(1차) / `run3.log`(2차, **PASS 기준**) / [backend/logs/backend.log](backend/logs/backend.log) (RETURN-001 root cause 식별용)
- Setup 환경 노트
  - ADMIN: `test2@test.com / rladyddn00!` — 로그인 OK (member_id=2)
  - USER A: 명세상 `test@test.com / Test1234!` — **로그인 실패** (DB 해시와 명세 비밀번호 불일치). USER_A_TOKEN 빈 값 진행. USER A 본인 소유 주문이 0건이라, 본인 주문 시나리오에서는 데이터 보유자(member_id=2)의 토큰을 `USER_A_OWNER_TOKEN` 으로 흡수.
  - USER B: `returntest_b@test.com / Test1234!` (회원가입 + 로그인) — member_id=465. S3(권한 검증)는 의미 보존을 위해 USER B 토큰으로 수행.
  - 주문 상태 분포(member_id=2): PENDING 6/8, PAID/PREPARING/SHIPPED **0건** → S4 일부 SKIP, DELIVERED+confirmed 1/4/10, DELIVERED+신청가능 7/11
  - S8/S9 용 임시 DELIVERED 주문은 setup.sh 가 `orders + order_item` 직접 INSERT (결제 레코드 없음, 실행마다 새 ID)

### 검증 결과 요약

**1차 실행 (`run2.log`, 이슈 발견 단계)**

| 시나리오 | 결과 | 비고 |
|---|---|---|
| S1 비로그인 신청 | PASS | 401 |
| S2 타인 주문에 신청 | FAIL | 500 (RETURN-001) |
| S3 USER가 admin 액션 시도 | PASS | 403×3 |
| S4 신청 불가 상태 신청 | FAIL(PENDING) / SKIP×3 | PAID/PREPARING/SHIPPED 데이터 부재 |
| S5 구매확정 주문에 신청 | FAIL | 500 (RETURN-001) |
| S6 RETURN 후 EXCHANGE | FAIL | 1차/2차 모두 500 |
| S7 RETURN 후 RETURN | FAIL | 1차/2차 모두 500 |
| S8 EXCHANGE COMPLETE 재고 | PASS | 994→995 (delta=+1) |
| S9 RETURN COMPLETE 재고 | FAIL | 123→125 (delta=+2, 명세상 0) (RETURN-002) |
| S10 이미지 업로드 4장 초과 | PASS(b) / FAIL(a) | (a) 단건 핸들러 한계 (RETURN-003) / (b) `TOO_MANY_IMAGES` 정상 |

→ PASS 3 + S10(b) / FAIL 6 + S10(a) / SKIP 3

**2차 실행 (`run3.log`, RETURN-001·RETURN-002 수정 후)**

| 시나리오 | 결과 | 비고 |
|---|---|---|
| S1 | PASS | 401 |
| S2 | PASS | 403 |
| S3 | PASS | 403×3 |
| S4 | PASS(PENDING) / SKIP×3 | PENDING=400 정상, 나머지 데이터 부재 |
| S5 | PASS | 400 |
| S6 | PASS | 1차 201 / 2차 400 (`ORDER_NOT_DELIVERED`) |
| S7 | PASS | 1차 201 / 2차 400 (`ORDER_NOT_DELIVERED`) |
| S8 | PASS | 994→995 (delta=+1) |
| S9 | PASS | 123→123 (delta=0) — RETURN-002 수정 효과 확인 |
| S10 | PASS(b) / FAIL(a) | (a) RETURN-003 미해결 |

→ **PASS 9 / FAIL 1(S10 a) / SKIP 3**

**핵심 수치**

- S6/S7 의 코드 흐름상 1차 RETURN 신청 후 `order.status` 가 `RETURN_REQUESTED` 로 변경되어 2차 신청에서는 `DUPLICATE_RETURN_REQUEST` 보다 `ORDER_NOT_DELIVERED` 가 먼저 트리거됨 — 모두 400 응답이라 명세 충족.
- S8 EXCHANGE COMPLETE 후 주문 상태 DELIVERED → DELIVERED 재설정 (정상).
- S9 RETURN COMPLETE 후 주문 상태 DELIVERED → REFUNDED (정상).

### 이슈 목록

| 번호 | 심각도 | 증상 | 원인 | 처리 |
|---|---|---|---|---|
| **RETURN-001** | 경미 | `POST /api/orders/{id}/return-exchange` 첫 호출 시 일관 500. 한글 reasonText 만 깨지고 영어 reasonText 는 정상 | Git Bash 의 single-quote 안 한글 UTF-8 바이트가 Windows native `curl.exe` 인자 변환 단계에서 **CP949 로 변환**되어 도착. 백엔드 Jackson 은 UTF-8 가정 파싱 → `Invalid UTF-8 middle byte 0xCE`. `GlobalExceptionHandler` 에 `HttpMessageNotReadableException` 전용 핸들러 없음 → fallback `Exception` 핸들러로 잡혀 500 | **RESOLVED** — scenario1/2/4/5/6/7 의 한글 reasonText → ASCII 변경. 백엔드 측 보완은 리팩토링 백로그로 이월 |
| **RETURN-002** | 확정 버그 | RETURN COMPLETE 시에도 재고가 +qty 복구되어 명세("RETURN→재고복구X") 위배. S9 에서 옵션 57 재고 123→125 | [ReturnExchangeService.completeRequest](backend/src/main/java/com/pantrka/backend/domain/order/service/ReturnExchangeService.java#L157-L191) 가 `request.getType()` 분기 없이 모든 OrderItem 에 `lockedOption.increaseStock(item.getQuantity())` 호출 | **RESOLVED** — 재고 복구 블록을 `if (request.getType() == ReasonType.EXCHANGE) { … }` 로 감쌈 ([ReturnExchangeService.java:166-179](backend/src/main/java/com/pantrka/backend/domain/order/service/ReturnExchangeService.java#L166-L179)). 2차 실행 S9 delta=0 확인 |
| **RETURN-003** | 저위험 | `POST /api/return-requests/images` 가 단일 `MultipartFile` 만 받음. 같은 요청에 file 4개 첨부해도 첫 파일만 처리하고 나머지 무시. 4장 초과 검증이 업로드 단에 없음 | 컨트롤러 시그니처가 단건 핸들러. 4장 검증은 신청 본체(`createRequest`)의 `imageUrls.size() > 3` 분기에서만 이루어짐 | **이월** — 데이터 무결성은 신청 본체 검증으로 방어됨. S3 비용/스팸 측면에서만 노출 |

### 리팩토링 백로그

1. **`GlobalExceptionHandler.HttpMessageNotReadableException` 핸들러 추가** — RETURN-001 의 백엔드 측 보완.
   - 깨진 JSON / 인코딩 / 잘못된 enum 값을 명확한 **400** 응답으로 매핑.
   - 메시지 예: `"요청 본문을 해석할 수 없습니다."` (raw exception message 노출 금지).
   - 현재는 catch-all `Exception` 핸들러로 빠져 500 + "서버 내부 오류" 로 매핑되어 운영 모니터링 노이즈 유발.
2. **catch-all `Exception` 핸들러에 stack trace logger 출력 추가**.
   - 현재는 stack trace 없이 메시지만 사용자에게 반환 → 디버깅 어려움.
   - `log.error("Unhandled exception", e);` 추가만으로 logs/backend.log 에 trace 기록.
3. **이미지 업로드 단계 카운팅/제한 강화** — RETURN-003.
   - 옵션 A: `POST /api/return-requests/images` 에 사용자 + 주문 단위 카운팅 (Redis 등) 도입 후 4장 초과 시 거부.
   - 옵션 B: 사전 업로드 자체를 폐지하고 신청 본체 multipart 로 통합.

> RETURN 트랙은 "1번 = AUTH 트랙의 백로그 항목 2(`/api/auth/refresh`) 수정 시 함께 작업"하기 좋은 형태. `GlobalExceptionHandler` 를 한 번 손대면서 `MissingRequestHeaderException` + `HttpMessageNotReadableException` 둘 다 정리.

---

## 주문/결제 트랙

- 실행: 2026-05-02 20:50 KST
- 백엔드 버전: `f80eea5` (branch `main`) + 작업 디렉토리에 AUTH-001/002 보완 untracked
  - `CustomAuthenticationEntryPoint`, `CustomAccessDeniedHandler` 등록 완료
  - `JwtAuthenticationFilter` 가 무효 토큰을 attribute 로 EntryPoint 에 위임
  - `RefreshTokenRequest` body 방식 컨트롤러 변경 (검증은 본 트랙 범위 외)
- 환경: Windows 11 / Git Bash / docker compose (shop-postgres healthy) / `./gradlew bootRun` 8080
- 검증 스크립트 위치: [backend/scripts/order-payment-test/](../backend/scripts/order-payment-test/) — `setup.sh` + `_helpers.sh` + `scenario1.sh~scenario11.sh`
- 원시 로그: [backend/scripts/order-payment-test/run.log](../backend/scripts/order-payment-test/run.log)
- Setup 환경 노트
  - ADMIN: `test2@test.com / rladyddn00!` (member_id=2) — 데이터 보유자, USER A 역할 흡수 (반품/교환 트랙과 동일 사유: `test@test.com` 비밀번호 불일치)
  - USER B: `orderpaytest_b@test.com / Test1234!` (신규 가입, member_id=466) — 권한/소유권 검증용
  - 기존 주문(member_id=2) 분포: PENDING 2 / DELIVERED 6 / CANCELLED 3 / REFUNDED 2 / RETURN_REQUESTED 2 / **PAID·PREPARING·SHIPPED 0건** → S4·S5·S8 일부 SKIP
  - 임시 주문 INSERT (S7~S11): orders + order_item (+ S7 한정 payment) 직접 INSERT, 결제 흐름 우회 — 통계 노이즈 발생
  - 임시 ID: `ORDER_S7_PAID=483`, `ORDER_S8_PAID=485`, `ORDER_S8_SHIP=484`, `ORDER_S8_REV=486`, `ORDER_S9=487 (member_coupon=12)`, `ORDER_S10=488 (option=57)`, `ORDER_S11=489 (product=25)`

### 검증 결과 요약

| 시나리오 | 케이스 | 결과 | 핵심 |
|---|---|---|---|
| S1 비로그인 | 6 endpoints | PASS 6/6 | 모두 **401** + 표준 `ApiResponse` (AUTH-001 패치 동작 재확인) |
| S2 타인 주문 접근 | 4 endpoints | PASS 4/4 | 자원 비유출. 단 OrderService=**404**, PaymentService=**403** 도메인 불일치 (AUTH-003 와 동일 — ORDER-003) |
| S3 USER → ADMIN | 2 endpoints | PASS 2/2 | **403** + 표준 `ApiResponse` (AUTH-005 패치 동작 재확인) |
| S4 취소 불가 상태 | 2 PASS / 2 SKIP | PASS | DELIVERED·CANCELLED → 400. PREPARING·SHIPPED 데이터 부재 |
| S5 구매확정 불가 상태 | 3 PASS / 3 SKIP | PASS | PENDING·CANCELLED → `ORDER_NOT_DELIVERED`. DELIVERED+confirmed → `ORDER_ALREADY_CONFIRMED`. PAID·PREPARING·SHIPPED 데이터 부재 |
| S6 주문 생성 룰 | 2 PASS / 2 SKIP | PASS | 존재하지 않는 cartItemId → 404 / 사용된 쿠폰 → 400. 재고 0 옵션 / 만료 쿠폰 데이터 부재 |
| S7 결제 승인 엣지 | 2 PASS / 1 SKIP | PASS | 미존재 orderNumber → **404**, 이미 PAID → 400 `ORDER_NOT_PENDING`. 토스 paymentKey 위조 SKIP |
| **S8 관리자 상태 변경 룰** | 3 케이스 | **FAIL 3/3** | PENDING→PAID, PENDING→SHIPPED(운송장 누락), CANCELLED→PAID 모두 **200** — ORDER-001 / ORDER-002 |
| S9 쿠폰 복원 | 1 케이스 | PASS | `member_coupon.used_at` → NULL, 주문 → CANCELLED |
| S10 재고 복구 | 1 케이스 | PASS | option(57).stock 123 → 125 (delta=+2) |
| S11 판매량 감소 | 1 PASS / 1 SKIP | PASS | product(25).sales_count 5 → 3 (delta=-2). PaymentService increase 는 토스 외부 API 의존 SKIP |

**핵심 수치**

- PASS 30 / FAIL 3 / SKIP 12 (총 45 호출)
- 치명적 보안 이슈: **0건** (인증·소유권 모두 동작)
- 비즈니스 룰 위배: **2건** (ORDER-001 상태 전환 룰 부재, ORDER-002 운송장 검증 부재)
- 응답 코드 일관성: **1건 재발견** (ORDER-003 = AUTH-003)

### 이슈 목록

| 번호 | 심각도 | 증상 | 원인 | 처리 |
|---|---|---|---|---|
| **ORDER-001** | 확정 버그 | 관리자 상태 변경에 전환 룰이 없어 임의 전환 모두 200 (테스트: `PENDING→PAID` 200, `CANCELLED→PAID` 200). 사이드이펙트가 분기 조건과 어긋남: `PENDING→PAID` 강제 시 결제 레코드/쿠폰 사용/판매량 증가 모두 누락 → DB 정합성 깨짐. `CANCELLED→PAID` 의 경우 [AdminOrderService:50-60](../backend/src/main/java/com/pantrka/backend/domain/admin/service/AdminOrderService.java#L50-L60) 의 `wasPaid` 가 `oldStatus=CANCELLED` 라 false 로 판정되어 추가 판매량/쿠폰 처리는 트리거되지 않으나, **상태만 PAID** 로 되돌아 환불 흐름이 꼬임 | [AdminOrderService.updateOrderStatus](../backend/src/main/java/com/pantrka/backend/domain/admin/service/AdminOrderService.java#L42-L86) 가 `OrderStatus` 전환 가능 여부를 검증하지 않음 (`order.updateStatus(newStatus)` 직호출). `ErrorCode.INVALID_ORDER_STATUS_TRANSITION` 정의는 있으나 사용처 0건 | **이월** |
| **ORDER-002** | 경미 (UX·운영 영향) | `PENDING → SHIPPED` 를 carrier/trackingNumber 없이 호출해도 200, DB 에 carrier/tracking_number 모두 NULL 로 저장. 운송장 발송 이메일은 "준비 중" fallback 으로 나가 고객 컨택 시 혼선 | [AdminOrderStatusUpdateRequest](../backend/src/main/java/com/pantrka/backend/domain/admin/dto/AdminOrderStatusUpdateRequest.java) 가 `status` 만 `@NotNull`. SHIPPED 전환 시 carrier/trackingNumber 검증 없음. [AdminOrderService:70-72](../backend/src/main/java/com/pantrka/backend/domain/admin/service/AdminOrderService.java#L70-L72) 의 `order.assignShipping(...)` 도 null 통과 | **이월** |
| **ORDER-003** | 경미 (AUTH-003 재확인) | 같은 "타인 주문" 호출인데 OrderService 계열은 404, PaymentService 는 403 으로 분기. 자원 존재 여부 노출/숨김 정책이 도메인마다 다름 | OrderService 는 `findByIdAndMemberId` (조회 자체에서 owner 결합), PaymentService 는 `findByOrderNumber` 후 `ORDER_FORBIDDEN` | **이월** (AUTH-003 백로그와 묶음) |

### 리팩토링 백로그

> 우선순위는 위에서 아래로(시급도순).

**주문 상태 전환 머신 도입** (ORDER-001)

1. `OrderStatus` 전환 가능 매트릭스를 단일 위치에 정의하고 [Order.updateStatus](../backend/src/main/java/com/pantrka/backend/domain/order/entity/Order.java) 또는 신설 `OrderStatusTransition` 유틸에서 강제.
   - 합법 전환 예: `PENDING → PAID/CANCELLED`, `PAID → PREPARING/CANCELLED/REFUNDED`, `PREPARING → SHIPPED/CANCELLED`, `SHIPPED → DELIVERED`, `DELIVERED → REFUNDED`(반품 완료), `RETURN_REQUESTED → REFUNDED/DELIVERED` 등.
   - 그 외는 `BusinessException(ErrorCode.INVALID_ORDER_STATUS_TRANSITION)` (이미 정의됨, 사용처 추가).
   - [AdminOrderService.updateOrderStatus](../backend/src/main/java/com/pantrka/backend/domain/admin/service/AdminOrderService.java#L42-L86), `Order.cancel()`, `Order.confirm()`, `ReturnExchangeService.completeRequest` 등 모든 상태 변경 진입점에서 위 검증을 거치도록 통일.
   - 이 검증을 켜면 `wasPaid` 등 분기 헬퍼도 단순화 가능.

**SHIPPED 전환 시 운송장 정보 필수화** (ORDER-002)

2. [AdminOrderStatusUpdateRequest](../backend/src/main/java/com/pantrka/backend/domain/admin/dto/AdminOrderStatusUpdateRequest.java) 에 `@AssertTrue` 또는 service-level 검증 추가:
   ```java
   if (newStatus == OrderStatus.SHIPPED) {
       if (!StringUtils.hasText(request.getCarrier()) || !StringUtils.hasText(request.getTrackingNumber())) {
           throw new BusinessException(ErrorCode.INVALID_INPUT); // 또는 신규 ErrorCode
       }
   }
   ```
   - 프론트 운송장 입력 모달은 이미 두 필드를 강제 — 백엔드에서 한 번 더 방어 (현재는 모달 우회 호출 시 NULL 통과).
   - SHIPPED 이메일의 "준비 중" fallback 도 자연스럽게 사문화.

**응답 코드 일관화** (ORDER-003)

3. AUTH 트랙 백로그 3번과 동일 작업: 사용자 간 자원 접근 응답 코드를 **404 통일** (자원 존재 숨김) 또는 **403 통일** (보유자 아님 명시) 중 하나로 결정. 결정 후 PaymentService 의 `ORDER_FORBIDDEN` 분기를 삭제하고 `findByOrderNumberAndMemberId` 같은 결합 조회로 변경.

> ORDER-001 만 확정 버그. 나머지는 운영·UX 품질이며 AUTH 트랙 백로그와 함께 정리하면 GlobalExceptionHandler / 응답 일관성 / 권한 정책을 한 사이클에 끝낼 수 있음.

---

## 쿠폰 트랙

- 실행: 2026-05-02 21:22 KST (1차 21:17 — S9 한글 페이로드 500 노이즈 확인 후 PG 직접 UPDATE 로 복구 패턴 적용 / 2차 21:22 — **PASS 기준**)
- 백엔드 버전: `f80eea5` (branch `main`) + 작업 디렉토리에 AUTH-001/002 보완 untracked
  - `CustomAuthenticationEntryPoint`, `CustomAccessDeniedHandler` 등록 → 401/403 표준 ApiResponse 동작 재확인
- 환경: Windows 11 / Git Bash / docker compose (shop-postgres healthy) / `./gradlew bootRun` 8080
- 검증 스크립트 위치: [backend/scripts/coupon-test/](../backend/scripts/coupon-test/) — `setup.sh` + `_helpers.sh` + `scenario1.sh~scenario10.sh`
- 원시 로그: [backend/scripts/coupon-test/run2.log](../backend/scripts/coupon-test/run2.log) (PASS 기준)
- Setup 환경 노트
  - ADMIN: `test2@test.com / rladyddn00!` (member_id=2) — 데이터 보유자, USER A 역할 흡수 (다른 트랙과 동일 사유: `test@test.com` 비밀번호 불일치)
  - USER B: `coupontest_b_${epoch_sec}@test.com / Test1234!` 매 실행 신규 가입 (member_id=468 — 회차마다 증가) — 웰컴 쿠폰 자동 발급 검증용
  - 활성 웰컴 쿠폰: id=10 "웰컴가입쿠폰_3" (PERCENT 15%, validDays=30, end_date=2032-12-25)
  - 임시 쿠폰 INSERT (실행마다 새 ID): TEST-COUPON-FRESH(정상), TEST-COUPON-EXPIRED(end_date 과거), TEST-COUPON-SOLDOUT(total=1·issued=1), TEST-S8-DELETABLE, TEST-S9-CANDIDATE
  - 사전 발급된 쿠폰: ADMIN(member_id=2)의 mc.id=1 (coupon_id=1 "First", FIXED 5000, minOrderAmount=30000)

### 검증 결과 요약

| 시나리오 | 케이스 | 결과 | 핵심 |
|---|---|---|---|
| S1 비로그인 호출 | 4 endpoints | **PASS 4/4** | GET/POST 모두 401 + 표준 ApiResponse |
| S2 USER → ADMIN API | 4 endpoints | **PASS 4/4** | GET/POST/PATCH/DELETE 모두 403 + 표준 ApiResponse |
| S3 웰컴 쿠폰 자동 발급 | 1 케이스 | **PASS** | USER B 가입 즉시 `member_coupon` 1행 생성, c.is_welcome=true, expiredAt=가입일+30일 |
| S4 중복 발급 차단 | 1 케이스 | **PASS** | 400 `COUPON_ALREADY_ISSUED`, member_coupon 행 수 불변 |
| S5 만료/소진 쿠폰 차단 | 3 케이스 (만료/소진/대조군) | **PASS 3/3** | 만료=400 `COUPON_EXPIRED` / 소진=400 `COUPON_OUT_OF_STOCK` / 정상=201 |
| S6 웰컴 수동 발급 차단 | 2 케이스 (issue / 다운로드 목록) | **PASS 2/2** | 직접 issue=400 `WELCOME_COUPON_NOT_DOWNLOADABLE`, GET /api/coupons 응답에 웰컴 쿠폰 미노출 |
| S7 쿠폰 할인 미리보기 | 5 케이스 | **PASS 5/5** | 정상=200 `discountAmount=5000` / minOrderAmount 미충족=400 / 사용된 쿠폰=400 / 본인 아님=404 / 미존재=404 |
| S8 관리자 쿠폰 수정 제약 | 3 케이스 | **PASS 3/3** | 변경 불가 필드(discountType/Value)는 DTO 미수용으로 200+불변 / issuedQty>0 삭제=400 / issuedQty=0 삭제=204 |
| S9 웰컴 쿠폰 단일 유지 | 1 케이스 | **PASS** | 일반 쿠폰 B → isWelcome=true PATCH 시 기존 A 자동 unmark, 활성 웰컴 카운트=1 유지 |
| S10 만료일 계산 | 1 케이스 | **PASS** | `expiredAt - createdAt = validDays * 86400`, 차이 0초 (허용 ±60초) |

**핵심 수치**

- PASS 27 / FAIL 0 / SKIP 0 (총 27 호출)
- 치명적 보안 이슈: **0건** (인증·권한·소유권·웰컴 정책 모두 의도대로)
- 비즈니스 룰 위배: **0건** (만료/소진/중복/단일유지/만료일계산 명세 부합)
- 발견 이슈: **2건** (모두 개선 제안 — COUPON-001 / COUPON-002)

**비고**

- S7 본인 아님 케이스: PaymentService 와 달리 쿠폰은 mc 미존재(404)로 떨어져 자원 존재 숨김. AUTH-003 / ORDER-003 의 "404 통일 권장" 정책과 일관 → 이 트랙에서는 추가 이슈 아님.
- S8 의 "변경 불가 필드(discountType/discountValue)"는 `CouponUpdateRequest` 자체에 필드가 없어 페이로드를 보내도 Jackson이 무시하고 200 응답. DB 불변은 보장되나 클라이언트가 "내가 보낸 변경이 무시되었다"는 사실을 알 수 없음 → COUPON-001.
- S9 의 1차 시도 시 PATCH 페이로드에 기존 웰컴 쿠폰 한글 이름("웰컴가입쿠폰_3")이 포함되어 500 (`Invalid UTF-8 middle byte`). RETURN-001 와 동일 원인 → COUPON-002. 스크립트는 회귀 안정성을 위해 원상 복구 단계를 PG 직접 UPDATE 로 변경.

### 이슈 목록

| 번호 | 심각도 | 증상 | 원인 | 처리 |
|---|---|---|---|---|
| **COUPON-001** | 개선 제안 | `PATCH /api/admin/coupons/{id}` 에 명세상 "변경 불가 필드"인 `discountType` / `discountValue` 를 포함해 보내도 200 응답. DB는 불변하지만 클라이언트는 자기 변경이 무시된 사실을 알 수 없음 | [CouponUpdateRequest.java](../backend/src/main/java/com/pantrka/backend/domain/coupon/dto/CouponUpdateRequest.java) 에 두 필드 자체가 없어 Jackson 이 unknown property 로 조용히 무시 | **이월** (선택적 — 명시적 거절을 위해서는 `@JsonInclude` 또는 컨트롤러 입력 검증 추가 필요) |
| **COUPON-002** | 경미 (RETURN-001 재발견) | 관리자 PATCH 페이로드에 한글 쿠폰 이름 포함 시 500 + `JSON parse error: Invalid UTF-8 middle byte`. Git Bash + Windows curl 조합에서만 재현 | RETURN-001 와 동일 원인. `GlobalExceptionHandler` 에 `HttpMessageNotReadableException` 전용 핸들러가 없어 catch-all 500 으로 매핑 | **이월** (RETURN 트랙 백로그 1번과 묶음) |

### 리팩토링 백로그

> 우선순위는 위에서 아래로(시급도순).

**예외 처리 표준화 (재확인)**

1. **`GlobalExceptionHandler.HttpMessageNotReadableException` 전용 핸들러 추가** — RETURN 트랙 백로그 1번과 동일. 본 트랙에서 COUPON-002 로 재현되어 영향 범위가 쿠폰 PATCH 까지 미친다는 점을 확인.
   - 깨진 JSON / 인코딩 / 잘못된 enum 값을 명확한 **400** 응답으로 매핑.
   - 메시지 예: `"요청 본문을 해석할 수 없습니다."` (raw exception message 노출 금지).
   - 한 번 작업하면 RETURN/쿠폰/주문 PATCH 등 한글 본문이 들어가는 모든 엔드포인트에서 공통 효과.

**쿠폰 수정 입력 검증 강화** (COUPON-001)

2. **변경 불가 필드 명시적 거절** — `@JsonProperty(access = WRITE_ONLY)` 같은 우회보다 입력 DTO 에 unknown property 거절 정책을 적용하거나 컨트롤러 단에서 raw `Map` 으로 받아 차단:
   ```java
   // ObjectMapper 전역 설정
   FAIL_ON_UNKNOWN_PROPERTIES = true   // 단, 다른 도메인 영향 큼
   // 또는 CouponUpdateRequest 에 @JsonAlias 등으로 명시 후 service 에서 거절
   ```
   - 또는 DTO 에 `@JsonAnySetter` 로 받아 키가 `discountType`/`discountValue` 면 400.
   - 우선순위 낮음. 현 동작도 데이터 무결성은 유지됨 (DB 불변).

**동시성 / 트랜잭션 후속 검증 (이번 트랙 범위 외, 백로그 누적)**

3. **쿠폰 발급 동시성** — `CouponService.issueCoupon` 은 단일 `@Transactional` 만으로 동작하며 다음 두 가지 race 가능:
   - 같은 쿠폰을 같은 사용자가 동시 issue → `existsByMemberIdAndCouponId` 둘 다 false 후 INSERT 2회 (member_coupon 에 (member_id, coupon_id) UNIQUE 제약 미존재)
   - `total_quantity = N` 쿠폰을 `> N` 명이 동시 issue → over-issue 가능 (`coupon.issue()` 가 단순 `++` 이며 `findById` 가 락을 잡지 않음)
   - 주문 도메인의 `findByIdWithLock + entityManager.refresh` 패턴을 쿠폰 발급에도 적용 검토.
   - 동시성 트랙(별도)에서 자동화 테스트 추가하면 좋음.

> COUPON-001/002 모두 RETURN/AUTH 트랙 백로그와 묶어 한 번에 처리 가능. 별도 작업 단위로 분리할 필요 없음.
