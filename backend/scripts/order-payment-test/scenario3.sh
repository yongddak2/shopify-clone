#!/bin/bash
# S3 — USER 가 관리자 API 호출
# 기대: 403 + ApiResponse 표준 바디 (CustomAccessDeniedHandler)

source "$(dirname "$0")/_helpers.sh"

echo "=== S3: USER 가 관리자 API 호출 ==="

print_call "GET /api/admin/orders (USER B)" \
  -X GET "$BASE_URL/api/admin/orders" \
  -H "Authorization: Bearer $USER_B_TOKEN"

# 어떤 주문이든 관계없이 권한 차단 우선
TARGET_ID="${ORDER_ANY:-1}"
print_call "PATCH /api/admin/orders/$TARGET_ID/status (USER B)" \
  -X PATCH "$BASE_URL/api/admin/orders/$TARGET_ID/status" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"PAID"}'
