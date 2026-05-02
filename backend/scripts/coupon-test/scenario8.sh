#!/bin/bash
# S8 — 관리자 쿠폰 수정 제약
# - CouponUpdateRequest 에 discount_type/discount_value 필드 자체가 없음
#   → 페이로드에 임의 필드를 넣어도 200 응답 + DB 불변 (명세상 변경 불가 필드)
# - issuedQuantity > 0 쿠폰 삭제 → 400 COUPON_HAS_ISSUED_MEMBERS

source "$(dirname "$0")/_helpers.sh"

echo "=== S8: 관리자 쿠폰 수정 제약 ==="
echo "S8_DELETABLE_COUPON=$S8_DELETABLE_COUPON, S8_DELETE_BLOCKED_COUPON_ID=$S8_DELETE_BLOCKED_COUPON_ID"

# 8-1) 변경 불가 필드 — 페이로드에 임의 discountType/discountValue 포함
echo ""
echo "-- 8-1) 할인타입/할인금액 변경 시도 (필드 자체가 미지원이라 무시되어야 함)"
BEFORE=$($PG -c "SELECT discount_type||'|'||discount_value FROM coupon WHERE id=$S8_DELETABLE_COUPON;")
echo "  BEFORE: $BEFORE"

print_call "PATCH /api/admin/coupons/$S8_DELETABLE_COUPON (discount 변경 시도)" -X PATCH "$BASE_URL/api/admin/coupons/$S8_DELETABLE_COUPON" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"TEST-S8-DELETABLE-PATCHED\",\"totalQuantity\":50,\"startDate\":\"2026-04-01T00:00:00\",\"endDate\":\"2027-12-01T00:00:00\",\"discountType\":\"PERCENT\",\"discountValue\":99}"

AFTER=$($PG -c "SELECT discount_type||'|'||discount_value FROM coupon WHERE id=$S8_DELETABLE_COUPON;")
echo "  AFTER : $AFTER"
if [ "$BEFORE" = "$AFTER" ]; then
  echo "  → PASS: 할인타입/할인금액 불변 (BEFORE==AFTER)"
else
  echo "  → FAIL: 할인타입/할인금액 변경됨"
fi

# 8-2) issuedQuantity > 0 쿠폰 삭제 시도
echo ""
echo "-- 8-2) issuedQuantity > 0 쿠폰 삭제 차단"
BEFORE_DEL=$($PG -c "SELECT issued_quantity FROM coupon WHERE id=$S8_DELETE_BLOCKED_COUPON_ID;" | tr -d '[:space:]')
echo "  대상 쿠폰 id=$S8_DELETE_BLOCKED_COUPON_ID issued_quantity=$BEFORE_DEL"

print_call "DELETE /api/admin/coupons/$S8_DELETE_BLOCKED_COUPON_ID" -X DELETE "$BASE_URL/api/admin/coupons/$S8_DELETE_BLOCKED_COUPON_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

EXISTS=$($PG -c "SELECT COUNT(*) FROM coupon WHERE id=$S8_DELETE_BLOCKED_COUPON_ID;" | tr -d '[:space:]')
echo "  쿠폰 잔존 행 수: $EXISTS (기대: 1)"

# 8-3) issuedQuantity = 0 쿠폰 삭제 시도 (정상 — 대조군)
echo ""
echo "-- 8-3) issuedQuantity = 0 쿠폰 정상 삭제 (대조군)"
print_call "DELETE /api/admin/coupons/$S8_DELETABLE_COUPON" -X DELETE "$BASE_URL/api/admin/coupons/$S8_DELETABLE_COUPON" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
GONE=$($PG -c "SELECT COUNT(*) FROM coupon WHERE id=$S8_DELETABLE_COUPON;" | tr -d '[:space:]')
echo "  삭제 후 행 수: $GONE (기대: 0)"
