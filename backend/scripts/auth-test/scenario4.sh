#!/usr/bin/env bash
# 시나리오 4: 만료/잘못된 토큰
# 모두 401 + 적절한 에러 메시지 기대 (실제 동작 확인)

set -u
BASE="${BASE:-http://localhost:8080}"

call() {
  local label="$1"; local token="$2"
  code=$(curl -s -o /tmp/_body -w "%{http_code}" \
    -H "Authorization: Bearer $token" \
    "$BASE/api/users/me")
  body=$(head -c 200 /tmp/_body | tr -d '\n')
  printf "%-45s -> %s | %s\n" "$label" "$code" "$body"
}

echo "=== 1) 형식 깨진 토큰 (3-segment but garbage) ==="
call "Bearer abc.def.ghi" "abc.def.ghi"

echo "=== 2) JWT 형식이 아닌 단순 문자열 ==="
call "Bearer hello" "hello"

echo "=== 3) Bearer 누락 (헤더 형식 자체가 깨짐) ==="
code=$(curl -s -o /tmp/_body -w "%{http_code}" -H "Authorization: foobar" "$BASE/api/users/me")
body=$(head -c 200 /tmp/_body | tr -d '\n')
printf "%-45s -> %s | %s\n" "non-Bearer header" "$code" "$body"

echo "=== 4) Authorization 헤더 자체 빈 문자열 ==="
code=$(curl -s -o /tmp/_body -w "%{http_code}" -H "Authorization: " "$BASE/api/users/me")
body=$(head -c 200 /tmp/_body | tr -d '\n')
printf "%-45s -> %s | %s\n" "empty Authorization" "$code" "$body"

echo "=== 5) 다른 시크릿으로 서명한 토큰 ==="
# 임의 secret으로 같은 payload 사이닝 (Node로 생성)
FAKE_TOKEN=$(node -e '
const crypto = require("crypto");
const header = Buffer.from(JSON.stringify({alg:"HS384"})).toString("base64url");
const payload = Buffer.from(JSON.stringify({sub:"2",role:"ADMIN",iat:1700000000,exp:9999999999})).toString("base64url");
const data = header + "." + payload;
const sig = crypto.createHmac("sha384", "wrong_secret_at_least_48_bytes_long_for_hs384_signing").update(data).digest("base64url");
console.log(data + "." + sig);
')
call "wrong-secret HS384 token" "$FAKE_TOKEN"

echo "=== 6) Refresh 엔드포인트 동작 확인 ==="
REFRESH_TOK=$(grep -oE '"refreshToken":"[^"]+' /tmp/login_a.json | sed 's/"refreshToken":"//')
code=$(curl -s -o /tmp/_body -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOK\"}" \
  "$BASE/api/auth/refresh")
body=$(head -c 300 /tmp/_body | tr -d '\n')
printf "%-45s -> %s | %s\n" "valid refresh -> new access" "$code" "$body"

echo "=== 7) 만료된(임의 exp 과거) 토큰: 다른 secret 안 써도 형식만 만료된 토큰 ==="
# 우리 secret 모르므로 expired 토큰 만들기 어려움 — refresh로 새 토큰 받아 그 access의 exp을 시뮬레이션 못 함
# 대신 형식상 expired인 토큰을 임의 시크릿으로 만들어서 401 동작 확인
EXPIRED_TOKEN=$(node -e '
const crypto = require("crypto");
const header = Buffer.from(JSON.stringify({alg:"HS384"})).toString("base64url");
const payload = Buffer.from(JSON.stringify({sub:"463",role:"USER",iat:1700000000,exp:1700000001})).toString("base64url");
const data = header + "." + payload;
const sig = crypto.createHmac("sha384", "wrong_secret_at_least_48_bytes_long_for_hs384_signing").update(data).digest("base64url");
console.log(data + "." + sig);
')
call "expired (and wrong-sig) token" "$EXPIRED_TOKEN"
