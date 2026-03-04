#!/usr/bin/env bash
# Module 06: Smoke Test — Same surface as Module 05 (Auth + CRUD)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc docker

PORT=3000
BASE="http://localhost:${PORT}"
echo -e "${CYAN}Module 06: Professional Testing Workflows — Smoke Test${NC}"
echo ""

docker_up
db_push
start_tsx_server "after/index.ts" "$PORT"

# ── Register → 201 ─────────────────────────────────────────────────
RESULT=$(http_post "$BASE/api/auth/register" '{"username":"smokeuser","password":"password123"}')
STATUS=$(echo "$RESULT" | cut -d'|' -f1)
if [ "$STATUS" = "201" ]; then pass "POST /api/auth/register returns 201"; else fail "POST /api/auth/register returns 201 (got: $STATUS)"; fi

# ── Login → 200 + token ────────────────────────────────────────────
RESULT=$(http_post "$BASE/api/auth/login" '{"username":"smokeuser","password":"password123"}')
LOGIN_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
TOKEN=$(extract_json_field "$(echo "$RESULT" | cut -d'|' -f2-)" "token")
if [ "$LOGIN_STATUS" = "200" ] && [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  pass "POST /api/auth/login returns 200 with JWT"
else
  fail "POST /api/auth/login returns 200 with JWT (got: $LOGIN_STATUS)"
fi

# ── GET /api/books (public) → 200 ──────────────────────────────────
STATUS=$(http_get "$BASE/api/books")
if [ "$STATUS" = "200" ]; then pass "GET /api/books (no auth) returns 200"; else fail "GET /api/books (no auth) returns 200 (got: $STATUS)"; fi

# ── POST /api/books without auth → 401 ─────────────────────────────
RESULT=$(http_post "$BASE/api/books" '{"title":"Test","author":"A","pages":100,"published":"2024"}')
STATUS=$(echo "$RESULT" | cut -d'|' -f1)
if [ "$STATUS" = "401" ]; then pass "POST /api/books (no auth) returns 401"; else fail "POST /api/books (no auth) returns 401 (got: $STATUS)"; fi

# ── POST /api/books with customer → 403 ────────────────────────────
RESULT=$(http_post "$BASE/api/books" '{"title":"Test","author":"A","pages":100,"published":"2024"}' "Bearer $TOKEN")
STATUS=$(echo "$RESULT" | cut -d'|' -f1)
if [ "$STATUS" = "403" ]; then pass "POST /api/books (customer role) returns 403"; else fail "POST /api/books (customer role) returns 403 (got: $STATUS)"; fi

check_result
