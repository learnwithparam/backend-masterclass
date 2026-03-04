#!/usr/bin/env bash
# Module 02: Smoke Test — Express Health Check Server
# Starts the server, hits endpoints with curl, validates responses.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc

PORT=3000
echo -e "${CYAN}Module 02: Servers from Scratch — Smoke Test (port ${PORT})${NC}"
echo ""

# ── Start server ────────────────────────────────────────────────────
start_tsx_server "after/index.ts" "$PORT"

# ── Test 1: GET /health → 200 + {"status":"ok"} ────────────────────
BODY=$(http_get_body "http://localhost:${PORT}/health")
STATUS=$(http_get "http://localhost:${PORT}/health")

if [ "$STATUS" = "200" ]; then
  pass "GET /health returns 200"
else
  fail "GET /health returns 200 (got: $STATUS)"
fi

HEALTH_STATUS=$(extract_json_field "$BODY" "status")
if [ "$HEALTH_STATUS" = "ok" ]; then
  pass "GET /health body has status=ok"
else
  fail "GET /health body has status=ok (got: $HEALTH_STATUS)"
fi

# ── Test 2: GET /nonexistent → 404 ─────────────────────────────────
STATUS=$(http_get "http://localhost:${PORT}/nonexistent")
if [ "$STATUS" = "404" ]; then
  pass "GET /nonexistent returns 404"
else
  fail "GET /nonexistent returns 404 (got: $STATUS)"
fi

check_result
