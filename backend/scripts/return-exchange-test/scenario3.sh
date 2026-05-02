#!/bin/bash
# S3 — 일반 USER가 관리자 액션 시도. 기대 403.
# 명세는 USER A 토큰을 명시했으나 본 환경에서 USER A(test@test.com) 의 주문이 없어
# USER A 역할을 ADMIN 토큰으로 흡수했기에, 일반 USER 권한 검증은 USER B 토큰으로 수행.
source "$(dirname "$0")/_helpers.sh"

echo "=== S3 일반 USER 가 admin 액션 시도 (USER B 토큰) ==="

# 임의의 request id (없어도 권한 필터에서 막혀 403 나와야 정상)
REQ_ID=1

print_call "PATCH /api/admin/requests/$REQ_ID/approve" \
  -X PATCH "$BASE_URL/api/admin/requests/$REQ_ID/approve" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adminMemo":"unauthorized"}'

print_call "PATCH /api/admin/requests/$REQ_ID/reject" \
  -X PATCH "$BASE_URL/api/admin/requests/$REQ_ID/reject" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adminMemo":"unauthorized"}'

print_call "PATCH /api/admin/requests/$REQ_ID/complete" \
  -X PATCH "$BASE_URL/api/admin/requests/$REQ_ID/complete" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json"
