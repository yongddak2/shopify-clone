#!/bin/bash
# S8 — 관리자 상태 변경 권한 및 규칙
# (a) PENDING → PAID 강제 전환
#     관리자가 임의로 PAID 변경 가능한가? (코드상 상태 전환 룰 없음)
# (b) SHIPPED 변경 시 carrier/trackingNumber 없이 호출
#     (DTO 검증 없음 → 200 기대 — 이슈 후보)
# (c) CANCELLED → PAID 같은 역방향 전환

source "$(dirname "$0")/_helpers.sh"

echo "=== S8: 관리자 상태 변경 룰 ==="

call_admin() {
  local label="$1" oid="$2" body="$3"
  if [ -z "$oid" ]; then
    skip "$label (대상 주문 없음)"
    return
  fi
  print_call "PATCH /api/admin/orders/$oid/status  ($label)" \
    -X PATCH "$BASE_URL/api/admin/orders/$oid/status" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body"
}

# (a) PENDING → PAID
call_admin "PENDING -> PAID" "$ORDER_S8_PAID" '{"status":"PAID"}'

# (b) SHIPPED + carrier 없음
call_admin "PENDING -> SHIPPED (carrier 없음)" "$ORDER_S8_SHIP" '{"status":"SHIPPED"}'

# (c) CANCELLED → PAID 역방향
call_admin "CANCELLED -> PAID (역방향)" "$ORDER_S8_REV" '{"status":"PAID"}'

# DB 상태 확인 (변화 여부)
echo "-- DB 상태 확인"
$PG -c "SELECT id, status, carrier, tracking_number FROM orders WHERE id IN ($ORDER_S8_PAID, $ORDER_S8_SHIP, $ORDER_S8_REV) ORDER BY id;"
