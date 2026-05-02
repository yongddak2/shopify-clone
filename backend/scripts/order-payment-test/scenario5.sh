#!/bin/bash
# S5 — 구매 확정 불가 상태에서 confirm 시도
# DELIVERED 만 가능 + confirmed_at IS NULL.
# 그 외 → 400 ORDER_NOT_DELIVERED
# DELIVERED + confirmed_at 있음 → 400 ORDER_ALREADY_CONFIRMED

source "$(dirname "$0")/_helpers.sh"

echo "=== S5: 구매 확정 불가 상태에서 confirm 시도 ==="

call_confirm() {
  local label="$1" oid="$2"
  if [ -z "$oid" ]; then
    skip "$label (해당 상태 주문 없음)"
    return
  fi
  print_call "POST /api/orders/$oid/confirm  ($label)" \
    -X POST "$BASE_URL/api/orders/$oid/confirm" \
    -H "Authorization: Bearer $USER_A_OWNER_TOKEN"
}

call_confirm "PENDING" "$ORDER_PENDING"
call_confirm "PAID" "$ORDER_PAID_EXISTING"
call_confirm "PREPARING" "$ORDER_PREPARING"
call_confirm "SHIPPED" "$ORDER_SHIPPED"
call_confirm "CANCELLED" "$ORDER_CANCELLED"
call_confirm "DELIVERED+confirmedAt (이미 확정)" "$ORDER_DELIVERED_CONFIRMED"
