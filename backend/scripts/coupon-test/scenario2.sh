#!/bin/bash
# S2 — USER 가 ADMIN API 호출
# USER 토큰으로 관리자 쿠폰 API 시도 → 403 기대 (AUTH-005 패치 후 ApiResponse 표준 바디)

source "$(dirname "$0")/_helpers.sh"

echo "=== S2: USER → ADMIN API ==="

CREATE_PAYLOAD='{"name":"USER-ATTEMPT","discountType":"FIXED","discountValue":1000,"totalQuantity":10,"startDate":"2026-05-01T00:00:00","endDate":"2027-01-01T00:00:00"}'
UPDATE_PAYLOAD='{"name":"hacked","totalQuantity":10,"startDate":"2026-05-01T00:00:00","endDate":"2027-01-01T00:00:00"}'

print_call "USER B → POST /api/admin/coupons" -X POST "$BASE_URL/api/admin/coupons" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD"

print_call "USER B → PATCH /api/admin/coupons/$S8_DELETABLE_COUPON" -X PATCH "$BASE_URL/api/admin/coupons/$S8_DELETABLE_COUPON" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD"

print_call "USER B → DELETE /api/admin/coupons/$S8_DELETABLE_COUPON" -X DELETE "$BASE_URL/api/admin/coupons/$S8_DELETABLE_COUPON" \
  -H "Authorization: Bearer $USER_B_TOKEN"

print_call "USER B → GET /api/admin/coupons" -X GET "$BASE_URL/api/admin/coupons" \
  -H "Authorization: Bearer $USER_B_TOKEN"
