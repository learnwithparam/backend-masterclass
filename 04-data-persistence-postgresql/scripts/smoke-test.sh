#!/usr/bin/env bash
# Module 04: Smoke Test — CRUD + PostgreSQL
# Starts Docker Compose (Postgres), pushes schema, starts server, tests CRUD.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc docker

PORT=3000
BASE="http://localhost:${PORT}/api/books"
echo -e "${CYAN}Module 04: Data Persistence with PostgreSQL — Smoke Test${NC}"
echo ""

# ── Start Docker + push schema ──────────────────────────────────────
docker_up
db_push

# ── Start server ────────────────────────────────────────────────────
start_tsx_server "after/index.ts" "$PORT"

# ── Test 1: GET /api/books → 200 ───────────────────────────────────
STATUS=$(http_get "$BASE")
if [ "$STATUS" = "200" ]; then
  pass "GET /api/books returns 200"
else
  fail "GET /api/books returns 200 (got: $STATUS)"
fi

# ── Test 2: POST /api/books → 201 ──────────────────────────────────
RESULT=$(http_post "$BASE" '{"title":"Smoke Test Book","author":"Tester","pages":100,"published":"2024"}')
POST_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
POST_BODY=$(echo "$RESULT" | cut -d'|' -f2-)

if [ "$POST_STATUS" = "201" ]; then
  pass "POST /api/books returns 201"
else
  fail "POST /api/books returns 201 (got: $POST_STATUS)"
fi

BOOK_ID=$(extract_json_field "$POST_BODY" "id")
if [ -n "$BOOK_ID" ] && [ "$BOOK_ID" != "null" ]; then
  pass "POST response includes book id ($BOOK_ID)"
else
  fail "POST response includes book id"
fi

# ── Test 3: GET /api/books/:id → 200 ───────────────────────────────
STATUS=$(http_get "$BASE/$BOOK_ID")
if [ "$STATUS" = "200" ]; then
  pass "GET /api/books/$BOOK_ID returns 200"
else
  fail "GET /api/books/$BOOK_ID returns 200 (got: $STATUS)"
fi

# ── Test 4: POST with bad data → 400 ───────────────────────────────
RESULT=$(http_post "$BASE" '{"title":"","author":"Bad"}')
BAD_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
if [ "$BAD_STATUS" = "400" ]; then
  pass "POST /api/books with invalid data returns 400"
else
  fail "POST /api/books with invalid data returns 400 (got: $BAD_STATUS)"
fi

# ── Test 5: DELETE /api/books/:id → 204 ────────────────────────────
DEL_STATUS=$(http_delete "$BASE/$BOOK_ID")
if [ "$DEL_STATUS" = "204" ]; then
  pass "DELETE /api/books/$BOOK_ID returns 204"
else
  fail "DELETE /api/books/$BOOK_ID returns 204 (got: $DEL_STATUS)"
fi

# ── Test 6: GET deleted book → 404 ─────────────────────────────────
STATUS=$(http_get "$BASE/$BOOK_ID")
if [ "$STATUS" = "404" ]; then
  pass "GET /api/books/$BOOK_ID after delete returns 404"
else
  fail "GET /api/books/$BOOK_ID after delete returns 404 (got: $STATUS)"
fi

check_result
