#!/bin/bash
# 반품/교환 검증 — Setup
# - ADMIN / USER A / USER B 토큰 발급
# - 시나리오에서 사용할 orderId 후보 수집 (DB 직접 조회)
# - S8/S9용 임시 DELIVERED 주문을 DB에 INSERT (검증 후 회수하지 않음 — 리포트에 명시)
#
# 사전조건
# - docker compose 가 떠 있고 backend(8080) / shop-postgres 가 healthy 한 상태
# - 테스트 계정 비밀번호 (CLAUDE.md 참고):
#     ADMIN test2@test.com / rladyddn00!
#     USER  test@test.com  / Test1234!
#
# 출력: tokens.env  (다른 시나리오 스크립트에서 source 함)

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

# 1) ADMIN 로그인
echo "-- ADMIN 로그인"
ADMIN_RES=$(login "test2@test.com" "rladyddn00!")
ADMIN_TOKEN=$(extract_token "$ADMIN_RES")
if [ -z "$ADMIN_TOKEN" ]; then
  echo "FAIL: ADMIN 로그인 실패. 응답: $ADMIN_RES"
  exit 1
fi
echo "ADMIN_TOKEN OK"

# 2) USER A 로그인 (test@test.com)
# 본 환경에서 비밀번호가 변경되었거나 가입되지 않았을 수 있어 실패해도 진행.
# USER A 본인 소유 주문이 0건이라 시나리오에서 거의 사용되지 않음.
echo "-- USER A 로그인 시도 (test@test.com)"
USER_A_RES=$(login "test@test.com" "Test1234!")
USER_A_TOKEN=$(extract_token "$USER_A_RES")
if [ -z "$USER_A_TOKEN" ]; then
  echo "WARN: USER A 로그인 실패 — 빈 토큰으로 진행. 응답: $USER_A_RES"
  USER_A_TOKEN=""
else
  echo "USER_A_TOKEN OK"
fi

# 명세 확인: USER A(test@test.com, member_id=1) 명의 주문이 0건이라
# 본인 소유 주문에 신청하는 시나리오는 검증 불가. 데이터 보유자(test2/member_id=2)의
# 주문을 USER A 역할로 사용하기 위해 ADMIN 토큰을 USER_A_OWNER_TOKEN 으로도 별도 보관.
# (S3는 일반 USER 권한 검증이 핵심이므로 USER_B_TOKEN 으로 검증.)
USER_A_OWNER_EMAIL="test2@test.com"
USER_A_OWNER_TOKEN="$ADMIN_TOKEN"
USER_A_OWNER_MEMBER_ID=2

# 3) USER B — 새 일반 회원 가입 (이미 존재하면 그대로 로그인)
USER_B_EMAIL="returntest_b@test.com"
USER_B_PASSWORD="Test1234!"
echo "-- USER B 가입/로그인 ($USER_B_EMAIL)"
SIGNUP_RES=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_B_EMAIL\",\"password\":\"$USER_B_PASSWORD\",\"name\":\"ReturnB\",\"phone\":\"01000000002\"}")
USER_B_RES=$(login "$USER_B_EMAIL" "$USER_B_PASSWORD")
USER_B_TOKEN=$(extract_token "$USER_B_RES")
if [ -z "$USER_B_TOKEN" ]; then
  echo "FAIL: USER B 로그인 실패. signup=$SIGNUP_RES login=$USER_B_RES"
  exit 1
fi
echo "USER_B_TOKEN OK"

# 4) 시나리오용 orderId 후보 수집 (member_id=2, USER A 역할)
echo "-- 주문 ID 후보 수집"

# PENDING — S4
ORDER_PENDING=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='PENDING' ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_PAID=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='PAID' ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_PREPARING=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='PREPARING' ORDER BY id LIMIT 1;" | tr -d '[:space:]')
ORDER_SHIPPED=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='SHIPPED' ORDER BY id LIMIT 1;" | tr -d '[:space:]')

# DELIVERED + confirmed_at 존재 — S5
ORDER_DELIVERED_CONFIRMED=$($PG -c "SELECT id FROM orders WHERE member_id=2 AND status='DELIVERED' AND confirmed_at IS NOT NULL ORDER BY id LIMIT 1;" | tr -d '[:space:]')

# DELIVERED + confirmed_at NULL + 진행중 request 없음 — S6, S7 용
ORDER_DELIVERED_NEW_LIST=$($PG -c "SELECT o.id FROM orders o WHERE o.member_id=2 AND o.status='DELIVERED' AND o.confirmed_at IS NULL AND NOT EXISTS (SELECT 1 FROM return_exchange_request r WHERE r.order_id=o.id AND r.status IN ('REQUESTED','APPROVED')) ORDER BY o.id LIMIT 5;")
ORDER_DELIVERED_NEW_1=$(echo "$ORDER_DELIVERED_NEW_LIST" | sed -n '1p' | tr -d '[:space:]')
ORDER_DELIVERED_NEW_2=$(echo "$ORDER_DELIVERED_NEW_LIST" | sed -n '2p' | tr -d '[:space:]')

# 비로그인 시나리오용 — 임의 존재 주문
ORDER_ANY=$($PG -c "SELECT id FROM orders ORDER BY id LIMIT 1;" | tr -d '[:space:]')

# 5) S8 / S9 용 임시 DELIVERED 주문 INSERT
# - S8 (EXCHANGE complete): option_value 1개, qty=1
# - S9 (RETURN complete): option_value 1개, qty=2
# 주의: 결제 레코드 없이 orders + order_item 만 INSERT (검증 목적). 통계엔 노이즈 발생.
echo "-- S8/S9 용 임시 DELIVERED 주문 INSERT"

# 충분한 재고를 가진 옵션 2개 선택 (재고가 큰 순)
read -r OPT_S8_ID OPT_S8_PRODUCT_ID OPT_S8_STOCK <<<"$($PG -c "SELECT pov.id, pog.product_id, pov.stock_quantity FROM product_option_value pov JOIN product_option_group pog ON pog.id=pov.option_group_id WHERE pov.stock_quantity>=10 ORDER BY pov.stock_quantity DESC LIMIT 1;" | tr '|' ' ')"
read -r OPT_S9_ID OPT_S9_PRODUCT_ID OPT_S9_STOCK <<<"$($PG -c "SELECT pov.id, pog.product_id, pov.stock_quantity FROM product_option_value pov JOIN product_option_group pog ON pog.id=pov.option_group_id WHERE pov.stock_quantity>=10 AND pov.id<>$OPT_S8_ID ORDER BY pov.stock_quantity DESC LIMIT 1;" | tr '|' ' ')"

ORDER_S8=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S8-'||EXTRACT(EPOCH FROM NOW())::bigint, 30000, 0, 3000, 33000, 'DELIVERED', 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
$PG -c "INSERT INTO order_item (order_id, product_id, option_value_id, product_name_snapshot, option_info_snapshot, price_snapshot, quantity, subtotal) VALUES ($ORDER_S8, $OPT_S8_PRODUCT_ID, $OPT_S8_ID, 'TEST', 'opt', 30000, 1, 30000);" >/dev/null

ORDER_S9=$($PG -c "INSERT INTO orders (member_id, order_number, total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, created_at, updated_at) VALUES (2, 'TEST-S9-'||EXTRACT(EPOCH FROM NOW())::bigint, 60000, 0, 0, 60000, 'DELIVERED', 'TEST', '01000000000', 'Seoul', NOW(), NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
$PG -c "INSERT INTO order_item (order_id, product_id, option_value_id, product_name_snapshot, option_info_snapshot, price_snapshot, quantity, subtotal) VALUES ($ORDER_S9, $OPT_S9_PRODUCT_ID, $OPT_S9_ID, 'TEST', 'opt', 30000, 2, 60000);" >/dev/null

# S8용 EXCHANGE 시 desired_option_value_id 로 사용할 다른 옵션 (S8 옵션과 다른 것이면 OK)
DESIRED_OPT_FOR_S8=$($PG -c "SELECT pov.id FROM product_option_value pov WHERE pov.option_group_id=(SELECT option_group_id FROM product_option_value WHERE id=$OPT_S8_ID) AND pov.id<>$OPT_S8_ID LIMIT 1;" | tr -d '[:space:]')
if [ -z "$DESIRED_OPT_FOR_S8" ]; then
  # 같은 그룹 내 다른 값이 없으면 그냥 동일 ID 사용 (검증엔 영향 없음)
  DESIRED_OPT_FOR_S8="$OPT_S8_ID"
fi

# 6) 결과 저장
{
  echo "BASE_URL=\"$BASE_URL\""
  echo "ADMIN_TOKEN=\"$ADMIN_TOKEN\""
  echo "USER_A_TOKEN=\"$USER_A_TOKEN\""
  echo "USER_A_OWNER_TOKEN=\"$USER_A_OWNER_TOKEN\""
  echo "USER_A_OWNER_EMAIL=\"$USER_A_OWNER_EMAIL\""
  echo "USER_A_OWNER_MEMBER_ID=$USER_A_OWNER_MEMBER_ID"
  echo "USER_B_TOKEN=\"$USER_B_TOKEN\""
  echo "USER_B_EMAIL=\"$USER_B_EMAIL\""
  echo "ORDER_ANY=\"$ORDER_ANY\""
  echo "ORDER_PENDING=\"$ORDER_PENDING\""
  echo "ORDER_PAID=\"$ORDER_PAID\""
  echo "ORDER_PREPARING=\"$ORDER_PREPARING\""
  echo "ORDER_SHIPPED=\"$ORDER_SHIPPED\""
  echo "ORDER_DELIVERED_CONFIRMED=\"$ORDER_DELIVERED_CONFIRMED\""
  echo "ORDER_DELIVERED_NEW_1=\"$ORDER_DELIVERED_NEW_1\""
  echo "ORDER_DELIVERED_NEW_2=\"$ORDER_DELIVERED_NEW_2\""
  echo "ORDER_S8=\"$ORDER_S8\""
  echo "ORDER_S9=\"$ORDER_S9\""
  echo "OPT_S8_ID=\"$OPT_S8_ID\""
  echo "OPT_S8_STOCK_BEFORE=\"$OPT_S8_STOCK\""
  echo "OPT_S9_ID=\"$OPT_S9_ID\""
  echo "OPT_S9_STOCK_BEFORE=\"$OPT_S9_STOCK\""
  echo "DESIRED_OPT_FOR_S8=\"$DESIRED_OPT_FOR_S8\""
} > "$ENV_FILE"

echo "=== Setup 완료 ==="
cat "$ENV_FILE"
