#!/usr/bin/env bash
# 시나리오 3: A 토큰으로 B의 자원 접근 시도 → 모두 차단되어야 함
# B 자원: 주문 ID=470 (PENDING), 배송지 ID=8, cart 항목 ID=502

set -u
BASE="${BASE:-http://localhost:8080}"
TOKEN_A=$(cat /tmp/user_a.tok)
B_ORDER_ID="${B_ORDER_ID:-470}"
B_ADDR_ID="${B_ADDR_ID:-8}"
B_CART_ID="${B_CART_ID:-502}"

call() {
  local method="$1"; local path="$2"; local data="${3-}"
  if [ -z "$data" ]; then data='{}'; fi
  code=$(curl -s -o /tmp/_body -w "%{http_code}" -X "$method" \
    -H "Authorization: Bearer $TOKEN_A" \
    -H "Content-Type: application/json" \
    -d "$data" "$BASE$path")
  body=$(head -c 250 /tmp/_body | tr -d '\n')
  printf "%-7s %-50s -> %s | %s\n" "$method" "$path" "$code" "$body"
}

echo "=== B의 주문 GET (A 토큰) ==="
call GET "/api/orders/$B_ORDER_ID"

echo "=== B의 주문 취소 (A 토큰) ==="
call POST "/api/orders/$B_ORDER_ID/cancel"

echo "=== B의 주문 구매확정 (A 토큰) ==="
call POST "/api/orders/$B_ORDER_ID/confirm"

echo "=== B의 반품/교환 조회 (A 토큰) ==="
call GET "/api/orders/$B_ORDER_ID/return-exchange"

echo "=== B의 배송지 PATCH (A 토큰) ==="
call PATCH "/api/users/me/addresses/$B_ADDR_ID" '{"label":"hijack","recipient":"X","phone":"01000000000","zipcode":"00000","address":"hijacked","addressDetail":"x","isDefault":false}'

echo "=== B의 배송지 DELETE (A 토큰) ==="
call DELETE "/api/users/me/addresses/$B_ADDR_ID"

echo "=== B의 cart 항목 PATCH (A 토큰) ==="
call PATCH "/api/cart/$B_CART_ID" '{"quantity":99}'

echo "=== B의 cart 항목 DELETE (A 토큰) ==="
call DELETE "/api/cart/$B_CART_ID"
