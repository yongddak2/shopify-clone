#!/usr/bin/env bash
# /api/auth/refresh 계약 검증 (ISSUE-002)
#
# 사전 조건: setup.sh 가 먼저 실행되어 /tmp/login_a.json 등에 토큰이 저장돼 있어야 함.
# 본 스크립트는 단독 실행해도 setup.sh 가 자동 호출되도록 한다.

set -u
BASE="${BASE:-http://localhost:8080}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# refresh 호출 시 토큰이 회전되므로 매 실행마다 fresh login.
# setup.sh 의 회원가입 단계는 이미 가입된 계정에 대해 400을 던질 수 있으나 무시한다.
A_EMAIL="${A_EMAIL:-authtest_a@test.com}"
A_PW="${A_PW:-Test1234!}"

# 회원가입(이미 있으면 무시)
curl -s -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$A_EMAIL\",\"password\":\"$A_PW\",\"name\":\"AuthA\",\"phone\":\"01011112222\",\"termsAgreed\":true,\"privacyAgreed\":true,\"marketingAgreed\":false}" \
  -o /dev/null -w "%{http_code}\n" > /dev/null

# 로그인으로 fresh refresh token 획득
curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$A_EMAIL\",\"password\":\"$A_PW\"}" \
  -o /tmp/login_a.json -w "%{http_code}\n" > /dev/null

REFRESH_TOK=$(LC_ALL=C.UTF-8 LANG=C.UTF-8 grep -oE '"refreshToken":"[^"]+' /tmp/login_a.json | sed 's/"refreshToken":"//')
if [ -z "$REFRESH_TOK" ]; then
  echo "FAIL: refreshToken을 추출하지 못했습니다 (setup.sh 먼저 실행 필요)"
  exit 1
fi

PASS=0
FAIL=0
declare -a FAIL_DETAILS

# 검증 헬퍼: status 와 success(true/false) 매칭, 추가로 data.accessToken 존재 여부 옵션
# 인자: 라벨, 기대상태, 기대success(true|false|any), data 필수여부(yes|no|any), 실제status, 실제body
check() {
  local label="$1"
  local exp_status="$2"
  local exp_success="$3"
  local exp_has_data="$4"
  local actual_status="$5"
  local actual_body="$6"

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

  if [ "$exp_has_data" = "yes" ]; then
    if echo "$actual_body" | grep -q "\"accessToken\""; then :; else
      ok=0; why="${why}${why:+, }data.accessToken missing"
    fi
  elif [ "$exp_has_data" = "no" ]; then
    if echo "$actual_body" | grep -q "\"data\":null"; then :; else
      ok=0; why="${why}${why:+, }data is not null"
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

curl_post() {
  local data="$1"
  curl -s -o /tmp/_refresh_body -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$data" \
    "$BASE/api/auth/refresh"
}

echo "=== 1) 정상 토큰 (200 + 새 accessToken) ==="
status=$(curl_post "{\"refreshToken\":\"$REFRESH_TOK\"}")
body=$(cat /tmp/_refresh_body)
check "valid refresh -> 200 success+accessToken" "200" "true" "yes" "$status" "$body"

echo ""
echo "=== 2) 필드 누락 (400, NotBlank) ==="
status=$(curl_post '{}')
body=$(cat /tmp/_refresh_body)
check "missing field -> 400 success=false" "400" "false" "no" "$status" "$body"

echo ""
echo "=== 3) 빈 문자열 (400, NotBlank) ==="
status=$(curl_post '{"refreshToken":""}')
body=$(cat /tmp/_refresh_body)
check "empty string -> 400 success=false" "400" "false" "no" "$status" "$body"

echo ""
echo "=== 4) 형식 깨진 토큰 (401 UNAUTHORIZED) ==="
status=$(curl_post '{"refreshToken":"abc.def.ghi"}')
body=$(cat /tmp/_refresh_body)
check "garbled token -> 401 success=false" "401" "false" "no" "$status" "$body"

echo ""
echo "=== 5) 다른 시크릿으로 서명한 토큰 (401 UNAUTHORIZED) ==="
WRONG_SIG_TOKEN=$(node -e '
const crypto = require("crypto");
const header = Buffer.from(JSON.stringify({alg:"HS384"})).toString("base64url");
const payload = Buffer.from(JSON.stringify({sub:"463",role:"USER",iat:1700000000,exp:9999999999})).toString("base64url");
const data = header + "." + payload;
const sig = crypto.createHmac("sha384","wrong_secret_at_least_48_bytes_long_for_hs384_signing_test").update(data).digest("base64url");
console.log(data + "." + sig);
')
status=$(curl_post "{\"refreshToken\":\"$WRONG_SIG_TOKEN\"}")
body=$(cat /tmp/_refresh_body)
check "wrong-signature token -> 401 success=false" "401" "false" "no" "$status" "$body"

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
