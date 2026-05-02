#!/usr/bin/env bash
# 시나리오 1: 비로그인 상태에서 인증 필요 API 호출
# Authorization 헤더 없이 호출 → 401 기대 (실제 401인지 403인지 확인)

set -u
BASE="${BASE:-http://localhost:8080}"

ENDPOINTS=(
  "GET /api/users/me"
  "PATCH /api/users/me"
  "GET /api/users/me/addresses"
  "POST /api/users/me/addresses"
  "GET /api/cart"
  "POST /api/cart"
  "GET /api/orders"
  "POST /api/orders"
  "GET /api/orders/1"
  "POST /api/orders/1/cancel"
  "POST /api/orders/1/confirm"
  "GET /api/wishlists"
  "GET /api/coupons/me"
  "GET /api/reviews/me"
  "DELETE /api/users/me"
  "PATCH /api/users/me/password"
  "GET /api/admin/products"
  "POST /api/admin/products"
  "PATCH /api/admin/orders/1/status"
  "GET /api/admin/dashboard"
  "GET /api/admin/users"
  "GET /api/admin/users/1"
  "PATCH /api/admin/users/1/role"
  "DELETE /api/admin/users/1"
  "POST /api/admin/coupons"
  "GET /api/admin/coupons"
  "GET /api/admin/banners"
  "GET /api/admin/inventory"
  "GET /api/admin/orders"
  "GET /api/admin/requests"
)

for entry in "${ENDPOINTS[@]}"; do
  method=$(echo "$entry" | awk '{print $1}')
  path=$(echo "$entry" | awk '{print $2}')
  code=$(curl -s -o /tmp/_body -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d '{}' "$BASE$path")
  body=$(head -c 200 /tmp/_body | tr -d '\n')
  printf "%-7s %-40s -> %s | %s\n" "$method" "$path" "$code" "$body"
done
