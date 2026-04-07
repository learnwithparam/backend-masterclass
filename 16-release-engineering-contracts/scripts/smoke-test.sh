#!/usr/bin/env bash
# Module 16: Smoke Test — Release Engineering, OpenAPI, and Load Drills
# Tests the published contract, release drill path, and a lightweight load pass.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc docker

PORT=3160
BASE="http://localhost:${PORT}"
export DATABASE_URL="postgres://user:password@localhost:5460/bookstore"
export FAILURE_DRILLS="enabled"
echo -e "${CYAN}Module 16: Release Engineering, Contracts, and Resilience — Smoke Test${NC}"
echo ""

# ── Start Docker + push schema ──────────────────────────────────────
docker_up
db_push

# ── Start server ────────────────────────────────────────────────────
start_tsx_server "after/index.ts" "$PORT"

# ── Setup: Register admin + get token ──────────────────────────────
RESULT=$(http_post "$BASE/api/auth/register" '{"username":"admin16","password":"password123"}')
# Promote to admin via direct DB update so the book upload path is authorized.
docker exec m16_postgres psql -U user -d bookstore -c "UPDATE users SET role='admin' WHERE username='admin16';" > /dev/null 2>&1
RESULT=$(http_post "$BASE/api/auth/login" '{"username":"admin16","password":"password123"}')
LOGIN_BODY=$(echo "$RESULT" | cut -d'|' -f2-)
TOKEN=$(extract_json_field "$LOGIN_BODY" "token")

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  pass "Admin login returns JWT token"
else
  fail "Admin login returns JWT token"
fi

# ── Seed books for release drill + pagination ───────────────────────
for i in $(seq 1 5); do
  http_post "$BASE/api/books" "{\"title\":\"Book $i\",\"author\":\"Author $i\",\"pages\":${i}00,\"published\":\"202$i\"}" "Bearer $TOKEN" > /dev/null 2>&1
done

# ── Test 0: Contract publishing ───────────────────────────────────
RESULT=$(curl -s "$BASE/openapi.json")
if [ "$(echo "$RESULT" | jq -r '.openapi')" = "3.0.3" ] && [ "$(echo "$RESULT" | jq -r '.paths["/api/v1/books"] != null')" = "true" ]; then
  pass "GET /openapi.json publishes the contract"
else
  fail "GET /openapi.json publishes the contract"
fi

# ── Test 1: Pagination — limit=2 returns 2 books + cursor ─────────
RESULT=$(curl -s "$BASE/api/v1/books?limit=2")
DATA_COUNT=$(echo "$RESULT" | jq '.data | length')
HAS_MORE=$(echo "$RESULT" | jq '.hasMore')
NEXT_CURSOR=$(echo "$RESULT" | jq '.nextCursor')

if [ "$DATA_COUNT" = "2" ] && [ "$HAS_MORE" = "true" ] && [ "$NEXT_CURSOR" != "null" ]; then
  pass "GET /api/v1/books?limit=2 returns 2 books with cursor"
else
  fail "GET /api/v1/books?limit=2 returns 2 books with cursor (got count=$DATA_COUNT hasMore=$HAS_MORE cursor=$NEXT_CURSOR)"
fi

# ── Test 2: Pagination — cursor returns next page ─────────────────
RESULT=$(curl -s "$BASE/api/v1/books?limit=2&cursor=$NEXT_CURSOR")
DATA_COUNT=$(echo "$RESULT" | jq '.data | length')
if [ "$DATA_COUNT" = "2" ]; then
  pass "GET /api/v1/books?cursor=N&limit=2 returns next page"
else
  fail "GET /api/v1/books?cursor=N&limit=2 returns next page (got count=$DATA_COUNT)"
fi

# ── Test 3: Upload cover image ────────────────────────────────────
# Create a tiny test image (1x1 PNG)
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' > /tmp/test-cover.png

RESULT=$(curl -s -w "%{http_code}" -o /tmp/upload-response.json \
  -X POST "$BASE/api/v1/books/1/cover" \
  -H "Authorization: Bearer $TOKEN" \
  -F "cover=@/tmp/test-cover.png;type=image/png")

if [ "$RESULT" = "201" ]; then
  pass "POST /api/v1/books/1/cover returns 201"
else
  fail "POST /api/v1/books/1/cover returns 201 (got: $RESULT)"
fi

# ── Test 4: Rate limiting ─────────────────────────────────────────
# Auth endpoint has limit of 10 per 15 min — we already used some
GOT_429=false
for i in $(seq 1 15); do
  RESULT=$(http_post "$BASE/api/auth/login" '{"username":"nobody","password":"wrong"}')
  STATUS=$(echo "$RESULT" | cut -d'|' -f1)
  if [ "$STATUS" = "429" ]; then
    GOT_429=true
    break
  fi
done

if [ "$GOT_429" = "true" ]; then
  pass "Rate limiter returns 429 after too many requests"
else
  fail "Rate limiter returns 429 after too many requests"
fi

# ── Test 5: Failure drill returns 503 when enabled ─────────────────
RESULT=$(curl -s -w "%{http_code}" -o /tmp/failure-drill.json "$BASE/api/v1/books?injectFailure=1")
if [ "$RESULT" = "503" ]; then
  pass "Failure drill path returns 503 when enabled"
else
  fail "Failure drill path returns 503 when enabled (got: $RESULT)"
fi

# ── Test 6: Load harness stays healthy ─────────────────────────────
if node scripts/load-test.js >/tmp/load-test.log 2>&1; then
  pass "Load harness completes successfully"
else
  fail "Load harness completes successfully"
  cat /tmp/load-test.log
fi

# ── Cleanup ───────────────────────────────────────────────────────
rm -f /tmp/test-cover.png /tmp/upload-response.json /tmp/failure-drill.json /tmp/load-test.log

check_result
