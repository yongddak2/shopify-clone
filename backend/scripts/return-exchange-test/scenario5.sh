#!/bin/bash
# S5 — DELIVERED + confirmed_at 있는 주문(구매확정)에 반품 신청 시도. 기대 400/409.
source "$(dirname "$0")/_helpers.sh"

echo "=== S5 구매확정 주문에 반품 신청 ==="
if [ -z "$ORDER_DELIVERED_CONFIRMED" ]; then
  skip "DELIVERED + confirmed_at 있는 본인 소유 주문이 없음 — 수동 확인 필요"
  exit 0
fi
print_call "POST /api/orders/$ORDER_DELIVERED_CONFIRMED/return-exchange (confirmed)" \
  -X POST "$BASE_URL/api/orders/$ORDER_DELIVERED_CONFIRMED/return-exchange" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"RETURN","reasonDetail":"DISLIKE","reasonText":"S5 confirmed check"}'
