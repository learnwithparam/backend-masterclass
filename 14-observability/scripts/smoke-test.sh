#!/usr/bin/env bash
# Module 14: Smoke Test — Observability (Health Checks, Request IDs, Metrics)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc docker

PORT=3000
BASE="http://localhost:${PORT}"
echo -e "${CYAN}Module 14: Observability — Smoke Test${NC}"
echo ""

# ── Start Docker + push schema ──────────────────────────────────────
docker_up
db_push

# ── Start server ────────────────────────────────────────────────────
start_tsx_server "after/index.ts" "$PORT"

# ── Test 1: Liveness check → 200 ───────────────────────────────────
STATUS=$(http_get "$BASE/health")
if [ "$STATUS" = "200" ]; then
  pass "GET /health returns 200"
else
  fail "GET /health returns 200 (got: $STATUS)"
fi

# ── Test 2: Readiness check → 200 (DB is up) ──────────────────────
RESULT=$(curl -s "$BASE/health/ready")
READY_STATUS=$(echo "$RESULT" | jq -r '.status')
if [ "$READY_STATUS" = "ready" ]; then
  pass "GET /health/ready returns ready"
else
  fail "GET /health/ready returns ready (got: $READY_STATUS)"
fi

# ── Test 3: X-Request-Id in response headers ──────────────────────
REQUEST_ID=$(curl -s -I "$BASE/health" | grep -i "x-request-id" | awk '{print $2}' | tr -d '\r')
if [ -n "$REQUEST_ID" ]; then
  pass "Response includes X-Request-Id header"
else
  fail "Response includes X-Request-Id header"
fi

# ── Test 4: Custom X-Request-Id is echoed ─────────────────────────
CUSTOM_ID="test-request-123"
ECHOED_ID=$(curl -s -I -H "X-Request-Id: $CUSTOM_ID" "$BASE/health" | grep -i "x-request-id" | awk '{print $2}' | tr -d '\r')
if [ "$ECHOED_ID" = "$CUSTOM_ID" ]; then
  pass "Custom X-Request-Id is echoed in response"
else
  fail "Custom X-Request-Id is echoed in response (got: $ECHOED_ID)"
fi

# ── Test 5: Metrics endpoint returns data ─────────────────────────
RESULT=$(curl -s "$BASE/health/metrics")
TOTAL=$(echo "$RESULT" | jq '.totalRequests')
if [ "$TOTAL" != "null" ] && [ "$TOTAL" -ge 0 ] 2>/dev/null; then
  pass "GET /health/metrics returns totalRequests"
else
  fail "GET /health/metrics returns totalRequests (got: $TOTAL)"
fi

# ── Test 6: API still works ───────────────────────────────────────
STATUS=$(http_get "$BASE/api/books")
if [ "$STATUS" = "200" ]; then
  pass "GET /api/books still returns 200"
else
  fail "GET /api/books still returns 200 (got: $STATUS)"
fi

check_result
