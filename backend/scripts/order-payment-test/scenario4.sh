#!/bin/bash
# S4 — 취소 불가 상태에서 취소 시도
# 취소 가능: PENDING, PAID. 그 외 모두 → 400 ORDER_CANCEL_NOT_ALLOWED
# 데이터 부재(PREPARING/SHIPPED/PAID): SKIP

source "$(dirname "$0")/_helpers.sh"

echo "=== S4: 취소 불가 상태에서 취소 시도 ==="

call_cancel() {
  local label="$1" oid="$2"
  if [ -z "$oid" ]; then
    skip "$label (해당 상태 주문 없음)"
    return
  fi
  print_call "POST /api/orders/$oid/cancel  ($label)" \
    -X POST "$BASE_URL/api/orders/$oid/cancel" \
    -H "Authorization: Bearer $USER_A_OWNER_TOKEN"
}

call_cancel "PREPARING" "$ORDER_PREPARING"
call_cancel "SHIPPED" "$ORDER_SHIPPED"
call_cancel "DELIVERED" "$ORDER_DELIVERED"
call_cancel "CANCELLED" "$ORDER_CANCELLED"
