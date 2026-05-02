#!/bin/bash
# 쿠폰 검증 — Setup
# - ADMIN / USER B(신규 가입, 웰컴 쿠폰 자동 발급 검증용) 토큰 발급
# - USER A 는 ADMIN(member_id=2)을 흡수 (다른 트랙과 동일: test@test.com 비밀번호 불일치)
# - 시나리오용 임시 쿠폰 INSERT
#   - EXPIRED_COUPON: end_date 이미 지난 쿠폰 (S5)
#   - SOLDOUT_COUPON: total_quantity=1, issued_quantity=1 (S5)
#   - S8/S9 용 임시 쿠폰 (수정/삭제 테스트)
#
# 사전조건
# - docker compose 가 떠 있고 backend(8080) / shop-postgres healthy
#
# 출력: tokens.env  (다른 시나리오 스크립트에서 source)
#
# DB 상태 조회 안내 쿼리:
#   SELECT id, name, is_welcome, total_quantity, issued_quantity, start_date, end_date FROM coupon ORDER BY id;
#   SELECT mc.id, mc.member_id, c.name, mc.used_at, mc.expired_at FROM member_coupon mc JOIN coupon c ON c.id=mc.coupon_id ORDER BY mc.id;

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

# USER A 슬롯 = ADMIN 흡수 (test@test.com 비밀번호 불일치 우회)
USER_A_OWNER_TOKEN="$ADMIN_TOKEN"
USER_A_OWNER_MEMBER_ID=2

# 2) USER B — S3(웰컴 쿠폰 자동 발급) 검증용 신규 가입
#    실행마다 새 이메일을 사용하여 "방금 가입" 시나리오를 보장
USER_B_SUFFIX="$(date +%s)"
USER_B_EMAIL="coupontest_b_${USER_B_SUFFIX}@test.com"
USER_B_PASSWORD="Test1234!"
echo "-- USER B 신규 가입 ($USER_B_EMAIL)"
SIGNUP_TIME_BEFORE_SEC=$(date +%s)
SIGNUP_RES=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_B_EMAIL\",\"password\":\"$USER_B_PASSWORD\",\"name\":\"CouponB\",\"phone\":\"01000000099\"}")
USER_B_RES=$(login "$USER_B_EMAIL" "$USER_B_PASSWORD")
USER_B_TOKEN=$(extract_token "$USER_B_RES")
if [ -z "$USER_B_TOKEN" ]; then
  echo "FAIL: USER B 로그인 실패. signup=$SIGNUP_RES login=$USER_B_RES"
  exit 1
fi
USER_B_MEMBER_ID=$($PG -c "SELECT id FROM member WHERE email='$USER_B_EMAIL';" | tr -d '[:space:]')
echo "USER_B_TOKEN OK (member_id=$USER_B_MEMBER_ID)"

# 3) 사전 발급된 쿠폰(ADMIN) 1건 확보 — S4 중복 발급 시도용
ALREADY_ISSUED_COUPON=$($PG -c "SELECT mc.coupon_id FROM member_coupon mc JOIN coupon c ON c.id=mc.coupon_id WHERE mc.member_id=2 AND c.is_welcome=false AND c.end_date > NOW() ORDER BY mc.id LIMIT 1;" | tr -d '[:space:]')
# 만약 비어 있으면 새 일반 쿠폰 만들고 ADMIN 에게 직접 INSERT
if [ -z "$ALREADY_ISSUED_COUPON" ]; then
  ALREADY_ISSUED_COUPON=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-S4-PRESET', 'FIXED', 1000, 0, 100, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')
  $PG -c "INSERT INTO member_coupon (member_id, coupon_id, expired_at, created_at) VALUES (2, $ALREADY_ISSUED_COUPON, NOW() + INTERVAL '30 day', NOW());" >/dev/null
fi

# 4) 미발급 일반 쿠폰 1건 확보 — S5 만료/소진 검증의 베이스라인 비교용 (정상 발급 가능 케이스)
FRESH_NORMAL_COUPON=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-COUPON-FRESH', 'FIXED', 1000, 0, 100, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')

# 5) 만료된 쿠폰 INSERT — S5
EXPIRED_COUPON=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-COUPON-EXPIRED', 'FIXED', 1000, 0, 100, 0, NOW() - INTERVAL '60 day', NOW() - INTERVAL '1 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')

# 6) 수량 소진 쿠폰 INSERT — S5
SOLDOUT_COUPON=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-COUPON-SOLDOUT', 'FIXED', 1000, 0, 1, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')

# 7) 웰컴 쿠폰 ID 조회 (S6/S10) — DB 의 활성 웰컴 쿠폰
WELCOME_COUPON=$($PG -c "SELECT id FROM coupon WHERE is_welcome=true ORDER BY id LIMIT 1;" | tr -d '[:space:]')
if [ -z "$WELCOME_COUPON" ]; then
  echo "FAIL: 활성 웰컴 쿠폰이 없음. 검증 불가."
  exit 1
fi

# 8) 사용된 member_coupon 1건 확보 — S7 (preview 실패 케이스)
USED_MEMBER_COUPON=$($PG -c "SELECT id FROM member_coupon WHERE member_id=2 AND used_at IS NOT NULL AND expired_at > NOW() ORDER BY id LIMIT 1;" | tr -d '[:space:]')
if [ -z "$USED_MEMBER_COUPON" ]; then
  TEMP_COUPON_S7U=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-S7-USED', 'FIXED', 1000, 0, 100, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')
  USED_MEMBER_COUPON=$($PG -c "INSERT INTO member_coupon (member_id, coupon_id, used_at, expired_at, created_at) VALUES (2, $TEMP_COUPON_S7U, NOW(), NOW() + INTERVAL '30 day', NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
fi

# 9) 미사용 member_coupon (ADMIN) 1건 확보 — S7 정상 preview / S8 삭제 차단(coupon 측 issuedQuantity>0)
USABLE_MEMBER_COUPON=$($PG -c "SELECT mc.id FROM member_coupon mc JOIN coupon c ON c.id=mc.coupon_id WHERE mc.member_id=2 AND mc.used_at IS NULL AND mc.expired_at > NOW() AND c.is_welcome=false ORDER BY mc.id LIMIT 1;" | tr -d '[:space:]')
if [ -z "$USABLE_MEMBER_COUPON" ]; then
  TEMP_COUPON_S7=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-S7-USABLE', 'FIXED', 3000, 10000, 100, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')
  USABLE_MEMBER_COUPON=$($PG -c "INSERT INTO member_coupon (member_id, coupon_id, expired_at, created_at) VALUES (2, $TEMP_COUPON_S7, NOW() + INTERVAL '30 day', NOW()) RETURNING id;" | head -1 | tr -d '[:space:]')
fi
USABLE_COUPON_INFO=$($PG -c "SELECT c.discount_type||'|'||c.discount_value FROM member_coupon mc JOIN coupon c ON c.id=mc.coupon_id WHERE mc.id=$USABLE_MEMBER_COUPON;" | tr -d '[:space:]')

# 10) 다른 회원의 member_coupon 1건 확보 — S7 본인 아님 케이스 (USER B 토큰으로 USABLE_MEMBER_COUPON 시도)
OTHER_MEMBER_COUPON="$USABLE_MEMBER_COUPON"

# 11) S8/S9 — 수정/삭제용 임시 쿠폰 2개 (issuedQuantity=0 으로 삭제 가능)
S8_DELETABLE_COUPON=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-S8-DELETABLE', 'FIXED', 500, 0, 100, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')
S8_DELETE_BLOCKED_COUPON_ID="$ALREADY_ISSUED_COUPON"  # issuedQuantity > 0 인 쿠폰 (삭제 차단 검증)

# 12) S8/S9 — isWelcome 전환 검증용 일반 쿠폰
S9_TARGET_COUPON=$($PG -c "INSERT INTO coupon (name, discount_type, discount_value, min_order_amount, total_quantity, issued_quantity, start_date, end_date, is_welcome) VALUES ('TEST-S9-CANDIDATE', 'PERCENT', 10, 0, 100, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 day', false) RETURNING id;" | head -1 | tr -d '[:space:]')
S9_OLD_WELCOME_ID="$WELCOME_COUPON"

# 13) S10 — 가입 시점 + validDays 계산 검증
WELCOME_VALID_DAYS=$($PG -c "SELECT valid_days FROM coupon WHERE id=$WELCOME_COUPON;" | tr -d '[:space:]')
WELCOME_END_DATE=$($PG -c "SELECT to_char(end_date, 'YYYY-MM-DD HH24:MI:SS') FROM coupon WHERE id=$WELCOME_COUPON;")

# 14) 결과 저장
{
  echo "BASE_URL=\"$BASE_URL\""
  echo "ADMIN_TOKEN=\"$ADMIN_TOKEN\""
  echo "USER_A_OWNER_TOKEN=\"$USER_A_OWNER_TOKEN\""
  echo "USER_A_OWNER_MEMBER_ID=$USER_A_OWNER_MEMBER_ID"
  echo "USER_B_TOKEN=\"$USER_B_TOKEN\""
  echo "USER_B_MEMBER_ID=$USER_B_MEMBER_ID"
  echo "USER_B_EMAIL=\"$USER_B_EMAIL\""
  echo "SIGNUP_TIME_BEFORE_SEC=$SIGNUP_TIME_BEFORE_SEC"
  echo "ALREADY_ISSUED_COUPON=\"$ALREADY_ISSUED_COUPON\""
  echo "FRESH_NORMAL_COUPON=\"$FRESH_NORMAL_COUPON\""
  echo "EXPIRED_COUPON=\"$EXPIRED_COUPON\""
  echo "SOLDOUT_COUPON=\"$SOLDOUT_COUPON\""
  echo "WELCOME_COUPON=\"$WELCOME_COUPON\""
  echo "USED_MEMBER_COUPON=\"$USED_MEMBER_COUPON\""
  echo "USABLE_MEMBER_COUPON=\"$USABLE_MEMBER_COUPON\""
  echo "USABLE_COUPON_INFO=\"$USABLE_COUPON_INFO\""
  echo "OTHER_MEMBER_COUPON=\"$OTHER_MEMBER_COUPON\""
  echo "S8_DELETABLE_COUPON=\"$S8_DELETABLE_COUPON\""
  echo "S8_DELETE_BLOCKED_COUPON_ID=\"$S8_DELETE_BLOCKED_COUPON_ID\""
  echo "S9_TARGET_COUPON=\"$S9_TARGET_COUPON\""
  echo "S9_OLD_WELCOME_ID=\"$S9_OLD_WELCOME_ID\""
  echo "WELCOME_VALID_DAYS=\"$WELCOME_VALID_DAYS\""
} > "$ENV_FILE"

echo "=== Setup 완료 ==="
cat "$ENV_FILE"
