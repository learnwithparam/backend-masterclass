#!/usr/bin/env bash
# Module 13: Smoke Test — WebSocket Real-Time Communication

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc docker

PORT=3000
BASE="http://localhost:${PORT}"
echo -e "${CYAN}Module 13: Real-Time WebSockets — Smoke Test${NC}"
echo ""

# ── Start Docker + push schema ──────────────────────────────────────
docker_up
db_push

# ── Start server ────────────────────────────────────────────────────
start_tsx_server "after/index.ts" "$PORT"

# ── Setup: Register + login ─────────────────────────────────────────
http_post "$BASE/api/auth/register" '{"username":"wsuser13","password":"password123"}' > /dev/null 2>&1
RESULT=$(http_post "$BASE/api/auth/login" '{"username":"wsuser13","password":"password123"}')
LOGIN_BODY=$(echo "$RESULT" | cut -d'|' -f2-)
TOKEN=$(extract_json_field "$LOGIN_BODY" "token")

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  pass "Login returns JWT token"
else
  fail "Login returns JWT token"
fi

# ── Test 1: WebSocket connects with valid token ─────────────────────
WS_OUTPUT=$(node "$MODULE_DIR/scripts/ws-test.cjs" "ws://localhost:${PORT}" "$TOKEN" 2000 2>&1)
WELCOME_TYPE=$(echo "$WS_OUTPUT" | jq -r '.[0].type' 2>/dev/null)

if [ "$WELCOME_TYPE" = "welcome" ]; then
  pass "WebSocket connects and receives welcome message"
else
  fail "WebSocket connects and receives welcome message (got: $WELCOME_TYPE)"
fi

# ── Test 2: Subscribe confirmation ──────────────────────────────────
SUB_TYPE=$(echo "$WS_OUTPUT" | jq -r '.[1].type' 2>/dev/null)

if [ "$SUB_TYPE" = "subscribed" ]; then
  pass "Subscribe to channel returns confirmation"
else
  fail "Subscribe to channel returns confirmation (got: $SUB_TYPE)"
fi

# ── Test 3: WebSocket rejects without token ─────────────────────────
REJECT_OUTPUT=$(node "$MODULE_DIR/scripts/ws-test.cjs" "ws://localhost:${PORT}" "" 2000 2>&1 || true)
REJECT_ERROR=$(echo "$REJECT_OUTPUT" | jq -r '.error' 2>/dev/null)

if [ -n "$REJECT_ERROR" ] || echo "$REJECT_OUTPUT" | grep -q "error"; then
  pass "WebSocket rejects connection without valid token"
else
  fail "WebSocket rejects connection without valid token"
fi

check_result
