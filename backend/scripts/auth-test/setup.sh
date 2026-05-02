#!/usr/bin/env bash
# 권한 테스트 사전 준비:
#  - 테스트 계정 2개 회원가입(authtest_a, authtest_b)
#  - ADMIN/USER_A/USER_B 토큰을 /tmp/*.tok 에 저장
#
# 이미 존재하는 계정이면 회원가입 단계는 무시되고 로그인만 수행됨.
# (회원가입 실패가 바로 종료되지 않게 || true 처리)

set -u
BASE="${BASE:-http://localhost:8080}"
ADMIN_EMAIL="${ADMIN_EMAIL:-test2@test.com}"
ADMIN_PW="${ADMIN_PW:-rladyddn00!}"

A_EMAIL="authtest_a@test.com"; A_PW="Test1234!"; A_NAME="AuthA"; A_PHONE="01011112222"
B_EMAIL="authtest_b@test.com"; B_PW="Test1234!"; B_NAME="AuthB"; B_PHONE="01033334444"

signup() {
  local email="$1"; local pw="$2"; local name="$3"; local phone="$4"
  curl -s -X POST "$BASE/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pw\",\"name\":\"$name\",\"phone\":\"$phone\",\"termsAgreed\":true,\"privacyAgreed\":true,\"marketingAgreed\":false}" \
    -o /dev/null -w "signup $email -> %{http_code}\n"
}

login() {
  local email="$1"; local pw="$2"; local out="$3"
  curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pw\"}" \
    -o "$out" -w "login $email -> %{http_code}\n"
}

# 회원가입 (이미 존재하면 400)
signup "$A_EMAIL" "$A_PW" "$A_NAME" "$A_PHONE" || true
signup "$B_EMAIL" "$B_PW" "$B_NAME" "$B_PHONE" || true

# 로그인
login "$ADMIN_EMAIL" "$ADMIN_PW" /tmp/admin_login.json
login "$A_EMAIL" "$A_PW"        /tmp/login_a.json
login "$B_EMAIL" "$B_PW"        /tmp/login_b.json

# 토큰 추출 (한글 locale에서 grep -P/지원 안 됨 → -E로 강제)
LC_ALL=C.UTF-8 LANG=C.UTF-8 grep -oE '"accessToken":"[^"]+' /tmp/admin_login.json | sed 's/"accessToken":"//' > /tmp/admin.tok
LC_ALL=C.UTF-8 LANG=C.UTF-8 grep -oE '"accessToken":"[^"]+' /tmp/login_a.json    | sed 's/"accessToken":"//' > /tmp/user_a.tok
LC_ALL=C.UTF-8 LANG=C.UTF-8 grep -oE '"accessToken":"[^"]+' /tmp/login_b.json    | sed 's/"accessToken":"//' > /tmp/user_b.tok

echo "tokens saved: /tmp/admin.tok /tmp/user_a.tok /tmp/user_b.tok"
wc -c /tmp/admin.tok /tmp/user_a.tok /tmp/user_b.tok
