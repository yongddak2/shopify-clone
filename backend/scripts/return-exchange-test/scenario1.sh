#!/bin/bash
# S1 — 비로그인 신청. 토큰 없이 POST /api/orders/{orderId}/return-exchange. 기대 401.
source "$(dirname "$0")/_helpers.sh"

echo "=== S1 비로그인 반품/교환 신청 ==="
print_call "POST /api/orders/$ORDER_ANY/return-exchange (no token)" \
  -X POST "$BASE_URL/api/orders/$ORDER_ANY/return-exchange" \
  -H "Content-Type: application/json" \
  -d '{"type":"RETURN","reasonDetail":"DISLIKE","reasonText":"no auth test"}'
