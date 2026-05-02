#!/bin/bash
# 주문/결제 검증 — Setup
# - ADMIN / USER A / USER B 토큰 발급
# - 시나리오에서 사용할 orderId 후보 수집 (DB 직접 조회)
# - PAID/PREPARING/SHIPPED 주문이 0건이라 일부 시나리오용 임시 주문을 INSERT
#   (결제 레코드는 S7용 1건만 추가, 통계엔 노이즈 발생 — 리포트에 명시)
#
# 사전조건
# - docker compose 가 떠 있고 backend(8080) / shop-postgres healthy
#
# 출력: tokens.env  (다른 시나리오 스크립트에서 source)

set -u
BASE_URL="http://localhost:8080"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/tokens.env"

PG="docker exec shop-postgres psql -U shop -d shopdb -tA"

login() {
  local email="$1" pw="$2"
  curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pw\"}"
}

extract_token() {
  echo "$1" | sed -nE 's/.*"accessToken":"([^"]+)".*/\1/p'
}

echo "=== Setup 시작 ==="

# 1) ADMIN 로그인 (member_id=2, 데이터 보유자)
echo "-- ADMIN 로그인"
ADMIN_RES=$(login "test2@test.com" "rladyddn00!")
ADMIN_TOKEN=$(extract_token "$ADMIN_RES")
if [ -z "$ADMIN_TOKEN" ]; then
  echo "FAIL: ADMIN 로그인 실패. 응답: $ADMIN_RES"
  exit 1
fi
echo "ADMIN_TOKEN OK"

# 2) USER A — 데이터 보유자(member_id=2) 흡수 (test@test.com 의 비밀번호 불일치 대응)
USER_A_OWNER_TOKEN="$ADMIN_TOKEN"
USER_A_OWNER_MEMBER_ID=2

# 3) USER B — 신규 가입 (이미 존재하면 그대로 로그인)
USER_B_EMAIL="orderpaytest_b@test.com"
USER_B_PASSWORD="Test1234!"
echo "-- USER B 가입/로그인 ($USER_B_EMAIL)"
SIGNUP_RES=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_B_EMAIL\",\"password\":\"$USER_B_PASSWORD\",\"name\":\"OrderPayB\",\"phone\":\"01000000003\"}")
USER_B_RES=$(login "$USER_B_EMAIL" "$USER_B_PASSWORD")
USER_B_TOKEN=$(extract_token "$USER_B_RES")
if [ -z "$USER_B_TOKEN" ]; then
  echo "FAIL: USER B 로그인 실패. signup=$SIGNUP_RES login=$USER_B_RES"
  exit 1
fi
USER_B_MEMBER_ID=$($PG -c "SELECT id FROM member WHERE email='$USER_B_EMAIL';" | tr -d '[:space:]')
echo "USER_B_TOKEN OK (member_id=$USER_B_MEMBER_ID)"

# 4) 기존 주문 후보 수집 (member_id=2)
echo "-- 기존 주문 ID 후보 수집"
ORDER_PENDING=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='PENDING' ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_PAID_EXISTING=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='PAID' ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_PREPARING=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='PREPARING' ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_SHIPPED=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='SHIPPED' ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_DELIVERED=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='DELIVERED' AND confirmed_at IS NULL ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_DELIVERED_CONFIRMED=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='DELIVERED' AND confirmed_at IS NOT NULL ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_CANCELLED=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='CANCELLED' ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_ANY=$($PG -c "SELECT id FROM orders ORDER BY id LIMIT 1;" | tr -d '[:space:]')

# 5) 임시 주문 INSERT — 충분한 재고 옵션 2개 선정
echo "-- 시나리오용 임시 주문 INSERT"

read -r OPT1_ID OPT1_PRODUCT_ID OPT1_STOCK <<<"$($PG -c "SELECT pov.id, pog.product_id, pov.stock_quantity FROM product_option_value pov JOIN product_option_group pog ON pog.id=pov.option_group_id WHERE pov.stock_quantity>=10 ORDER BY pov.stock_quantity DESC LIMIT 1;" | tr '|' ' ')"
read -r OPT2_ID OPT2_PRODUCT_ID OPT2_STOCK <<<"$($PG -c "SELECT pov.id, pog.product_id, pov.stock_quantity FROM product_option_value pov JOIN product_option_group pog ON pog.id=pov.option_group_id WHERE pov.stock_quantity>=10 AND pov.id<>$OPT1_ID ORDER BY pov.stock_quantity DESC LIMIT 1;" | tr '|' ' ')"

# S7 — PAID + payment(DONE) 레코드까지 포함 (재승인 시도용)
ORDER_S7_PAID=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S7-'||EXTRACT(EPOCH FROM NOW())::bigint, 30000, 0, 3000, 33000, 'PAID', 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
ORDER_S7_PAID_ORDERNUMBER=$($PG -c "SELECT order_number FROM orders WHERE id=$ORDER_S7_PAID;" | tr -d '[:space:]')
$PG -c "INSERT INTO order_item (order_id, product_id, option_value_id, product_name_snapshot, option_info_snapshot, price_snapshot, quantity, subtotal) VALUES ($ORDER_S7_PAID, $OPT1_PRODUCT_ID, $OPT1_ID, 'TEST', 'opt', 30000, 1, 30000);" >/dev/null
$PG -c "INSERT INTO payment (order_id, payment_key, method, amount, status, paid_at, created_at) VALUES ($ORDER_S7_PAID, 'TEST-PK-'||$ORDER_S7_PAID, 'CARD', 33000, 'DONE', NOW(), NOW());" >/dev/null

# S8(SHIPPED no carrier) — PENDING
ORDER_S8_SHIP=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S8a-'||EXTRACT(EPOCH FROM NOW())::bigint, 20000, 0, 3000, 23000, 'PENDING', 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')

# S8(PENDING -> PAID 강제) — PENDING
ORDER_S8_PAID=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S8b-'||EXTRACT(EPOCH FROM NOW())::bigint, 20000, 0, 3000, 23000, 'PENDING', 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')

# S8(CANCELLED -> PAID 역방향) — CANCELLED
ORDER_S8_REV=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S8c-'||EXTRACT(EPOCH FROM NOW())::bigint, 20000, 0, 3000, 23000, 'CANCELLED', 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')

# S9 — 쿠폰 적용 PENDING (member_coupon: used_at 사전 set, 미만료)
# 임시 쿠폰 + member_coupon INSERT (id 새로 부여)
COUPON_S9=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-S9', 'FIXED', 1000, 0, 100, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')
MC_S9=$($PG -c "INSERT INTO member_coupon (member_id, coupon_id, used_at, expired_at, created_at) VALUES (2, $COUPON_S9, NOW(), NOW() + INTERVAL '30 day', NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
ORDER_S9=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, member_coupon_id, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S9-'||EXTRACT(EPOCH FROM NOW())::bigint, 20000, 1000, 3000, 22000, 'PENDING', $MC_S9, 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')

# S10 — PENDING + option_value(qty=2) (재고 복구 검증)
ORDER_S10=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S10-'||EXTRACT(EPOCH FROM NOW())::bigint, 60000, 0, 0, 60000, 'PENDING', 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
$PG -c "INSERT INTO order_item (order_id, product_id, option_value_id, product_name_snapshot, option_info_snapshot, price_snapshot, quantity, subtotal) VALUES ($ORDER_S10, $OPT2_PRODUCT_ID, $OPT2_ID, 'TEST', 'opt', 30000, 2, 60000);" >/dev/null

# S11 — PAID + product.sales_count 증감 검증용
# product 의 sales_count 를 사전 +2 (취소 시 -2 검증)
$PG -c "UPDATE product SET sales_count = sales_count + 2 WHERE id=$OPT1_PRODUCT_ID;" >/dev/null
S11_PRODUCT_ID="$OPT1_PRODUCT_ID"
S11_SALES_BEFORE=$($PG -c "SELECT sales_count FROM product WHERE id=$S11_PRODUCT_ID;" | tr -d '[:space:]')
ORDER_S11=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S11-'||EXTRACT(EPOCH FROM NOW())::bigint, 30000, 0, 3000, 33000, 'PAID', 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
$PG -c "INSERT INTO order_item (order_id, product_id, option_value_id, product_name_snapshot, option_info_snapshot, price_snapshot, quantity, subtotal) VALUES ($ORDER_S11, $S11_PRODUCT_ID, $OPT1_ID, 'TEST', 'opt', 30000, 2, 60000);" >/dev/null

# 6) S6(주문 생성 비즈니스 룰) 데이터 — cart_item 직접 INSERT
# - CART_S6_USED_COUPON: 사용된 쿠폰 적용 시도용
# - CART_S6_NORMAL: 정상 카트 (재고 검증·존재안하는 옵션 시나리오는 현재 데이터 부재로 SKIP)
CART_S6_USED_COUPON=$($PG -c "INSERT INTO cart_item (member_id, product_id, option_value_id, quantity, created_at) VALUES (2, $OPT1_PRODUCT_ID, $OPT1_ID, 1, NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')

# member_coupon 사용된 것 (member_id=2, used_at 있음, 미만료)
USED_MEMBER_COUPON=$($PG -c "SELECT mc.id FROM member_coupon mc WHERE mc.member_id=2 AND mc.used_at IS NOT NULL AND mc.expired_at > NOW() ORDER BY mc.id LIMIT 1;" | tr -d '[:space:]')
# 없으면 새로 INSERT
if [ -z "$USED_MEMBER_COUPON" ]; then
  COUPON_S6=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-S6', 'FIXED', 1000, 0, 100, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')
  USED_MEMBER_COUPON=$($PG -c "INSERT INTO member_coupon (member_id, coupon_id, used_at, expired_at, created_at) VALUES (2, $COUPON_S6, NOW(), NOW() + INTERVAL '30 day', NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
fi

# 만료된 쿠폰 — 없으면 SKIP 표기
EXPIRED_MEMBER_COUPON=$($PG -c "SELECT mc.id FROM member_coupon mc WHERE mc.member_id=2 AND mc.expired_at < NOW() ORDER BY mc.id LIMIT 1;" | tr -d '[:space:]')

# 재고 0 옵션 — 없으면 SKIP 표기 (부수 효과 회피 위해 일부러 0으로 만들지 않음)
ZERO_STOCK_OPTION=$($PG -c "SELECT id FROM product_option_value WHERE stock_quantity=0 LIMIT 1;" | tr -d '[:space:]')

# 7) 결과 저장
{
  echo "BASE_URL=\"$BASE_URL\""
  echo "ADMIN_TOKEN=\"$ADMIN_TOKEN\""
  echo "USER_A_OWNER_TOKEN=\"$USER_A_OWNER_TOKEN\""
  echo "USER_A_OWNER_MEMBER_ID=$USER_A_OWNER_MEMBER_ID"
  echo "USER_B_TOKEN=\"$USER_B_TOKEN\""
  echo "USER_B_MEMBER_ID=$USER_B_MEMBER_ID"
  echo "USER_B_EMAIL=\"$USER_B_EMAIL\""
  echo "ORDER_ANY=\"$ORDER_ANY\""
  echo "ORDER_PENDING=\"$ORDER_PENDING\""
  echo "ORDER_PAID_EXISTING=\"$ORDER_PAID_EXISTING\""
  echo "ORDER_PREPARING=\"$ORDER_PREPARING\""
  echo "ORDER_SHIPPED=\"$ORDER_SHIPPED\""
  echo "ORDER_DELIVERED=\"$ORDER_DELIVERED\""
  echo "ORDER_DELIVERED_CONFIRMED=\"$ORDER_DELIVERED_CONFIRMED\""
  echo "ORDER_CANCELLED=\"$ORDER_CANCELLED\""
  echo "ORDER_S7_PAID=\"$ORDER_S7_PAID\""
  echo "ORDER_S7_PAID_ORDERNUMBER=\"$ORDER_S7_PAID_ORDERNUMBER\""
  echo "ORDER_S8_SHIP=\"$ORDER_S8_SHIP\""
  echo "ORDER_S8_PAID=\"$ORDER_S8_PAID\""
  echo "ORDER_S8_REV=\"$ORDER_S8_REV\""
  echo "ORDER_S9=\"$ORDER_S9\""
  echo "MC_S9=\"$MC_S9\""
  echo "ORDER_S10=\"$ORDER_S10\""
  echo "OPT_S10_ID=\"$OPT2_ID\""
  echo "OPT_S10_STOCK_BEFORE=\"$OPT2_STOCK\""
  echo "ORDER_S11=\"$ORDER_S11\""
  echo "S11_PRODUCT_ID=\"$S11_PRODUCT_ID\""
  echo "S11_SALES_BEFORE=\"$S11_SALES_BEFORE\""
  echo "CART_S6_USED_COUPON=\"$CART_S6_USED_COUPON\""
  echo "USED_MEMBER_COUPON=\"$USED_MEMBER_COUPON\""
  echo "EXPIRED_MEMBER_COUPON=\"$EXPIRED_MEMBER_COUPON\""
  echo "ZERO_STOCK_OPTION=\"$ZERO_STOCK_OPTION\""
  echo "OPT1_ID=\"$OPT1_ID\""
  echo "OPT1_PRODUCT_ID=\"$OPT1_PRODUCT_ID\""
} > "$ENV_FILE"

echo "=== Setup 완료 ==="
cat "$ENV_FILE"
