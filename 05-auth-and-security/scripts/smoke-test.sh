#!/usr/bin/env bash
# Module 05: Smoke Test — Auth + JWT + CRUD
# Starts Docker Compose (Postgres), pushes schema, starts server,
# tests registration, login, and role-based access control.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc docker

PORT=3000
BASE="http://localhost:${PORT}"
echo -e "${CYAN}Module 05: Authentication & Security — Smoke Test${NC}"
echo ""

# ── Start Docker + push schema ──────────────────────────────────────
docker_up
db_push

# ── Start server ────────────────────────────────────────────────────
start_tsx_server "after/index.ts" "$PORT"

# ── Test 1: Register a user → 201 ──────────────────────────────────
RESULT=$(http_post "$BASE/api/auth/register" '{"username":"smokeuser","password":"password123"}')
REG_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
if [ "$REG_STATUS" = "201" ]; then
  pass "POST /api/auth/register returns 201"
else
  fail "POST /api/auth/register returns 201 (got: $REG_STATUS)"
fi

# ── Test 2: Login → 200 + JWT token ────────────────────────────────
RESULT=$(http_post "$BASE/api/auth/login" '{"username":"smokeuser","password":"password123"}')
LOGIN_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
LOGIN_BODY=$(echo "$RESULT" | cut -d'|' -f2-)

if [ "$LOGIN_STATUS" = "200" ]; then
  pass "POST /api/auth/login returns 200"
else
  fail "POST /api/auth/login returns 200 (got: $LOGIN_STATUS)"
fi

TOKEN=$(extract_json_field "$LOGIN_BODY" "token")
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  pass "Login response includes JWT token"
else
  fail "Login response includes JWT token"
fi

# ── Test 3: GET /api/books without auth → 200 (public) ─────────────
STATUS=$(http_get "$BASE/api/books")
if [ "$STATUS" = "200" ]; then
  pass "GET /api/books (no auth) returns 200"
else
  fail "GET /api/books (no auth) returns 200 (got: $STATUS)"
fi

# ── Test 4: POST /api/books without auth → 401 ─────────────────────
RESULT=$(http_post "$BASE/api/books" '{"title":"Test","author":"A","pages":100,"published":"2024"}')
STATUS=$(echo "$RESULT" | cut -d'|' -f1)
if [ "$STATUS" = "401" ]; then
  pass "POST /api/books (no auth) returns 401"
else
  fail "POST /api/books (no auth) returns 401 (got: $STATUS)"
fi

# ── Test 5: POST /api/books with customer token → 403 ──────────────
RESULT=$(http_post "$BASE/api/books" '{"title":"Test","author":"A","pages":100,"published":"2024"}' "Bearer $TOKEN")
STATUS=$(echo "$RESULT" | cut -d'|' -f1)
if [ "$STATUS" = "403" ]; then
  pass "POST /api/books (customer role) returns 403"
else
  fail "POST /api/books (customer role) returns 403 (got: $STATUS)"
fi

check_result
