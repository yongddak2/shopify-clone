#!/usr/bin/env bash
# 통합 시나리오: 인증 실패 → refresh → 재인증 흐름이 끝까지 닿는지 확인
#
# 1) 잘못된 access token 으로 보호 엔드포인트 호출 → 401 + ApiResponse 바디
# 2) 정상 refresh token 으로 /api/auth/refresh 호출 → 200 + 새 access/refresh
# 3) 새 access token 으로 같은 엔드포인트 재호출 → 200
#
# 이 3단계가 모두 통과하면 백엔드 측 자동 재발급 전제 조건이 갖춰진 것.

set -u
BASE="${BASE:-http://localhost:8080}"
A_EMAIL="${A_EMAIL:-authtest_a@test.com}"
A_PW="${A_PW:-Test1234!}"

PASS=0
FAIL=0
declare -a FAIL_DETAILS

check() {
  local label="$1"
  local exp_status="$2"
  local exp_success="$3"
  local actual_status="$4"
  local actual_body="$5"

  local ok=1
  local why=""

  if [ "$actual_status" != "$exp_status" ]; then
    ok=0; why="status=$actual_status (expected $exp_status)"
  fi

  if [ "$exp_success" != "any" ]; then
    if echo "$actual_body" | grep -q "\"success\":$exp_success"; then :; else
      ok=0; why="${why}${why:+, }success!=$exp_success"
    fi
  fi

  if [ "$ok" = "1" ]; then
    printf "PASS  %s\n" "$label"
    PASS=$((PASS+1))
  else
    printf "FAIL  %s  (%s)\n" "$label" "$why"
    FAIL_DETAILS+=("---- $label ----")
    FAIL_DETAILS+=("  status: $actual_status")
    FAIL_DETAILS+=("  body  : $actual_body")
    FAIL=$((FAIL+1))
  fi
}

# 0) 사전 준비: 회원가입(이미 있으면 무시) + fresh login
curl -s -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$A_EMAIL\",\"password\":\"$A_PW\",\"name\":\"AuthA\",\"phone\":\"01011112222\",\"termsAgreed\":true,\"privacyAgreed\":true,\"marketingAgreed\":false}" \
  -o /dev/null -w "%{http_code}\n" > /dev/null

curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$A_EMAIL\",\"password\":\"$A_PW\"}" \
  -o /tmp/_login.json -w "%{http_code}\n" > /dev/null

REFRESH_TOK=$(LC_ALL=C.UTF-8 LANG=C.UTF-8 grep -oE '"refreshToken":"[^"]+' /tmp/_login.json | sed 's/"refreshToken":"//')

# 만료/형식오류로 보일 임의 토큰: 형식만 JWT인 잘못된 서명
BAD_ACCESS=$(node -e '
const crypto = require("crypto");
const header = Buffer.from(JSON.stringify({alg:"HS384"})).toString("base64url");
const payload = Buffer.from(JSON.stringify({sub:"463",role:"USER",iat:1700000000,exp:1700000001})).toString("base64url");
const data = header + "." + payload;
const sig = crypto.createHmac("sha384","wrong_secret_at_least_48_bytes_long_for_hs384_signing_test").update(data).digest("base64url");
console.log(data + "." + sig);
')

# 1) 잘못된 access token 으로 /api/users/me 호출 → 401
echo "=== 1) bad access -> 401 ==="
status=$(curl -s -o /tmp/_b -w "%{http_code}" \
  -H "Authorization: Bearer $BAD_ACCESS" \
  "$BASE/api/users/me")
body=$(cat /tmp/_b)
check "bad access -> 401" "401" "false" "$status" "$body"

# 2) 정상 refresh 로 새 access 발급 → 200
echo ""
echo "=== 2) refresh -> 200 + new accessToken ==="
status=$(curl -s -o /tmp/_b -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOK\"}" \
  "$BASE/api/auth/refresh")
body=$(cat /tmp/_b)
check "refresh -> 200" "200" "true" "$status" "$body"

# 새 access token 추출
NEW_ACCESS=$(LC_ALL=C.UTF-8 LANG=C.UTF-8 grep -oE '"accessToken":"[^"]+' /tmp/_b | sed 's/"accessToken":"//')

# 3) 새 access token 으로 /api/users/me 재호출 → 200
echo ""
echo "=== 3) re-call with new access -> 200 ==="
if [ -z "$NEW_ACCESS" ]; then
  echo "FAIL  re-call -> 200  (could not extract new accessToken from refresh response)"
  FAIL=$((FAIL+1))
else
  status=$(curl -s -o /tmp/_b -w "%{http_code}" \
    -H "Authorization: Bearer $NEW_ACCESS" \
    "$BASE/api/users/me")
  body=$(cat /tmp/_b)
  check "re-call with new access -> 200" "200" "true" "$status" "$body"
fi

echo ""
echo "================================="
echo "결과: PASS=$PASS  FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "실패 상세:"
  for line in "${FAIL_DETAILS[@]}"; do
    echo "$line"
  done
  exit 1
fi
