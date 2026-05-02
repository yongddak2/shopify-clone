#!/usr/bin/env bash
# 시나리오 2: USER 토큰으로 ADMIN API 호출 → 모두 차단(401/403)되어야 함

set -u
BASE="${BASE:-http://localhost:8080}"
TOKEN=$(cat /tmp/user_a.tok)

ENDPOINTS=(
  "GET /api/admin/products"
  "POST /api/admin/products"
  "GET /api/admin/products/1"
  "PATCH /api/admin/products/1"
  "DELETE /api/admin/products/1"
  "PATCH /api/admin/orders/1/status"
  "GET /api/admin/orders"
  "GET /api/admin/users"
  "GET /api/admin/users/1"
  "PATCH /api/admin/users/1/role"
  "PATCH /api/admin/users/1/memo"
  "DELETE /api/admin/users/1"
  "POST /api/admin/coupons"
  "GET /api/admin/coupons"
  "PATCH /api/admin/coupons/1"
  "DELETE /api/admin/coupons/1"
  "GET /api/admin/dashboard"
  "GET /api/admin/banners"
  "POST /api/admin/banners"
  "PATCH /api/admin/banners/1"
  "PUT /api/admin/banners/1"
  "DELETE /api/admin/banners/1"
  "GET /api/admin/inventory"
  "PATCH /api/admin/inventory/1"
  "GET /api/admin/requests"
  "PATCH /api/admin/requests/1/approve"
  "PATCH /api/admin/requests/1/reject"
  "PATCH /api/admin/requests/1/complete"
  "POST /api/admin/images"
  "DELETE /api/admin/images"
)

for entry in "${ENDPOINTS[@]}"; do
  method=$(echo "$entry" | awk '{print $1}')
  path=$(echo "$entry" | awk '{print $2}')
  code=$(curl -s -o /tmp/_body -w "%{http_code}" -X "$method" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{}' "$BASE$path")
  body=$(head -c 150 /tmp/_body | tr -d '\n')
  printf "%-7s %-40s -> %s | %s\n" "$method" "$path" "$code" "$body"
done
