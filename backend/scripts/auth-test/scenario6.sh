#!/usr/bin/env bash
# 시나리오 6: JWT 페이로드 변조
# USER 토큰의 sub/role을 변경한 뒤(서명은 그대로) ADMIN API 호출 → 401 기대

set -u
BASE="${BASE:-http://localhost:8080}"
USER_TOKEN=$(cat /tmp/user_a.tok)

echo "=== 원본 USER 토큰 디코드 ==="
node -e "
const t = process.argv[1];
const parts = t.split('.');
console.log('header :', JSON.parse(Buffer.from(parts[0], 'base64url')));
console.log('payload:', JSON.parse(Buffer.from(parts[1], 'base64url')));
console.log('sig    :', parts[2].substring(0, 30) + '...');
" "$USER_TOKEN"

echo ""
echo "=== role을 ADMIN으로 변조 (서명은 그대로) ==="
TAMPERED_ROLE=$(node -e "
const t = process.argv[1];
const parts = t.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64url'));
payload.role = 'ADMIN';
const newPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
console.log(parts[0] + '.' + newPayload + '.' + parts[2]);
" "$USER_TOKEN")
echo "Tampered: $(echo $TAMPERED_ROLE | cut -c 1-50)..."

echo "=== 변조 토큰으로 /api/users/me 호출 ==="
curl -s -X GET "$BASE/api/users/me" \
  -H "Authorization: Bearer $TAMPERED_ROLE" \
  -o /tmp/_b -w "STATUS:%{http_code}\n"
cat /tmp/_b | head -c 200; echo ""

echo "=== 변조 토큰으로 /api/admin/products 호출 ==="
curl -s -X GET "$BASE/api/admin/products" \
  -H "Authorization: Bearer $TAMPERED_ROLE" \
  -o /tmp/_b -w "STATUS:%{http_code}\n"
cat /tmp/_b | head -c 200; echo ""

echo "=== 변조 토큰으로 /api/admin/dashboard 호출 ==="
curl -s -X GET "$BASE/api/admin/dashboard" \
  -H "Authorization: Bearer $TAMPERED_ROLE" \
  -o /tmp/_b -w "STATUS:%{http_code}\n"
cat /tmp/_b | head -c 200; echo ""

echo ""
echo "=== sub를 ADMIN userId(=2)로 변조 (서명은 그대로) ==="
TAMPERED_SUB=$(node -e "
const t = process.argv[1];
const parts = t.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64url'));
payload.sub = '2';
const newPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
console.log(parts[0] + '.' + newPayload + '.' + parts[2]);
" "$USER_TOKEN")

echo "=== 변조 sub로 /api/users/me ==="
curl -s -X GET "$BASE/api/users/me" \
  -H "Authorization: Bearer $TAMPERED_SUB" \
  -o /tmp/_b -w "STATUS:%{http_code}\n"
cat /tmp/_b | head -c 300; echo ""

echo ""
echo "=== sub+role 모두 ADMIN으로 변조 ==="
TAMPERED_BOTH=$(node -e "
const t = process.argv[1];
const parts = t.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64url'));
payload.sub = '2';
payload.role = 'ADMIN';
const newPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
console.log(parts[0] + '.' + newPayload + '.' + parts[2]);
" "$USER_TOKEN")
curl -s -X GET "$BASE/api/admin/users" \
  -H "Authorization: Bearer $TAMPERED_BOTH" \
  -o /tmp/_b -w "STATUS:%{http_code}\n"
cat /tmp/_b | head -c 200; echo ""
