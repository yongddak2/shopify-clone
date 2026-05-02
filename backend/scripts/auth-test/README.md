# 권한 검증 테스트 스크립트

## 사용법

백엔드(localhost:8080)가 실행 중이어야 합니다.

```bash
# 사전 준비: 테스트 계정 회원가입 + 토큰 저장 (/tmp/*.tok)
bash backend/scripts/auth-test/setup.sh

# 시나리오 실행
bash backend/scripts/auth-test/scenario1.sh   # 비로그인 → 인증 API
bash backend/scripts/auth-test/scenario2.sh   # USER → ADMIN API
bash backend/scripts/auth-test/scenario3.sh   # A → B 자원
bash backend/scripts/auth-test/scenario4.sh   # 잘못된/만료 토큰
bash backend/scripts/auth-test/scenario5.sh   # ADMIN 본인 차단
bash backend/scripts/auth-test/scenario6.sh   # JWT 변조
```

## 의존성

- `curl`, `node`, `bash`, `sed`, `grep`
- 시나리오 3은 B 자원 ID(주문/배송지/cart)를 환경변수로 받음.
  현재 기본값은 본 작업 시점의 ID라 환경에 따라 달라질 수 있음:
  ```bash
  B_ORDER_ID=470 B_ADDR_ID=8 B_CART_ID=502 bash scenario3.sh
  ```

## 주의

`grep -P` 는 ko_KR locale 에서 동작 안 함 → 모든 grep 호출은 `LC_ALL=C.UTF-8 grep -oE` 형태로 사용.

## 결과 리포트

`docs/test-reports/AUTH_TEST_REPORT.md`
