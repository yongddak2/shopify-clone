#!/bin/bash
# S5 — 만료/비활성 쿠폰 발급 차단
# - 만료된 쿠폰 (end_date 과거) → 400 COUPON_EXPIRED
# - 수량 소진 (issued_quantity >= total_quantity) → 400 COUPON_OUT_OF_STOCK
# - 정상 신규 쿠폰 → 201 (대조군)

source "$(dirname "$0")/_helpers.sh"

echo "=== S5: 만료/소진 쿠폰 발급 차단 ==="
echo "EXPIRED_COUPON=$EXPIRED_COUPON, SOLDOUT_COUPON=$SOLDOUT_COUPON, FRESH_NORMAL_COUPON=$FRESH_NORMAL_COUPON"

print_call "POST /api/coupons/$EXPIRED_COUPON/issue (만료 쿠폰)" -X POST "$BASE_URL/api/coupons/$EXPIRED_COUPON/issue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

print_call "POST /api/coupons/$SOLDOUT_COUPON/issue (수량 소진)" -X POST "$BASE_URL/api/coupons/$SOLDOUT_COUPON/issue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

print_call "POST /api/coupons/$FRESH_NORMAL_COUPON/issue (정상 — 대조군)" -X POST "$BASE_URL/api/coupons/$FRESH_NORMAL_COUPON/issue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo ""
echo "[DB 검증]"
EXP_COUNT=$($PG -c "SELECT COUNT(*) FROM member_coupon WHERE member_id=2 AND coupon_id=$EXPIRED_COUPON;" | tr -d '[:space:]')
SOLDOUT_COUNT=$($PG -c "SELECT COUNT(*) FROM member_coupon WHERE member_id=2 AND coupon_id=$SOLDOUT_COUPON;" | tr -d '[:space:]')
FRESH_COUNT=$($PG -c "SELECT COUNT(*) FROM member_coupon WHERE member_id=2 AND coupon_id=$FRESH_NORMAL_COUPON;" | tr -d '[:space:]')
echo "  EXPIRED 발급 행 수: $EXP_COUNT (기대: 0)"
echo "  SOLDOUT 발급 행 수: $SOLDOUT_COUNT (기대: 0)"
echo "  FRESH 발급 행 수: $FRESH_COUNT (기대: 1 — 정상 발급)"
