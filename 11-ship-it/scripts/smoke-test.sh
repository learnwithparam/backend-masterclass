#!/usr/bin/env bash
# Module 11: Smoke Test — Docker Compose Production
# Builds and starts all containers (Node apps + Postgres + Redis),
# tests health checks, auth flow, and order placement.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands curl jq nc docker

ORDER_PORT=3000
INVENTORY_PORT=4000
BASE="http://localhost:${ORDER_PORT}"
echo -e "${CYAN}Module 11: Ship It — Production Smoke Test${NC}"
echo ""

# ── Build and start all containers ──────────────────────────────────
SMOKE_DOCKER_COMPOSE=1
echo -e "${YELLOW}Building Docker images (this may take a moment)...${NC}"
docker compose build
docker compose up -d
echo -e "${YELLOW}Waiting for production services to initialize...${NC}"
sleep 8

# Push schema (db should be healthy by now)
npm run db:push 2>/dev/null || npx drizzle-kit push 2>/dev/null

# Wait for HTTP endpoints to be ready
wait_for_http "$BASE/health" 30 2 || wait_for_http "http://localhost:${ORDER_PORT}/api/books" 10 2 || true
wait_for_http "http://localhost:${INVENTORY_PORT}/health" 30 2 || true

# ── Test 1: Health check on order-service ───────────────────────────
# Order service may not have /health, try /api/books instead
STATUS=$(http_get "$BASE/api/books" 2>/dev/null)
if [ "$STATUS" = "200" ]; then
  pass "Order service is responding (GET /api/books returns 200)"
else
  # Try /health as fallback
  STATUS=$(http_get "$BASE/health" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    pass "Order service is responding (GET /health returns 200)"
  else
    fail "Order service is responding (got: $STATUS)"
  fi
fi

# ── Test 2: Health check on inventory-service ───────────────────────
STATUS=$(http_get "http://localhost:${INVENTORY_PORT}/health")
if [ "$STATUS" = "200" ]; then
  pass "Inventory service is responding (GET /health returns 200)"
else
  fail "Inventory service is responding (got: $STATUS)"
fi

# ── Test 3: Register + Login ───────────────────────────────────────
RESULT=$(http_post "$BASE/api/auth/register" '{"username":"prod_user","password":"password123"}')
REG_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
if [ "$REG_STATUS" = "201" ]; then
  pass "POST /api/auth/register returns 201"
else
  fail "POST /api/auth/register returns 201 (got: $REG_STATUS)"
fi

RESULT=$(http_post "$BASE/api/auth/login" '{"username":"prod_user","password":"password123"}')
LOGIN_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
LOGIN_BODY=$(echo "$RESULT" | cut -d'|' -f2-)
TOKEN=$(extract_json_field "$LOGIN_BODY" "token")

if [ "$LOGIN_STATUS" = "200" ] && [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  pass "POST /api/auth/login returns 200 with JWT"
else
  fail "POST /api/auth/login returns 200 with JWT (got: $LOGIN_STATUS)"
fi

# ── Test 4: Create book (as admin) + place order ───────────────────
# Promote to admin via Docker exec into the db container
docker compose exec -T db psql -U user -d bookstore -c "UPDATE users SET role='admin' WHERE username='prod_user';" > /dev/null 2>&1

RESULT=$(http_post "$BASE/api/auth/login" '{"username":"prod_user","password":"password123"}')
ADMIN_TOKEN=$(extract_json_field "$(echo "$RESULT" | cut -d'|' -f2-)" "token")

RESULT=$(http_post "$BASE/api/books" '{"title":"Production Book","author":"Ship It","pages":250,"published":"2024"}' "Bearer $ADMIN_TOKEN")
BOOK_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
BOOK_BODY=$(echo "$RESULT" | cut -d'|' -f2-)
BOOK_ID=$(extract_json_field "$BOOK_BODY" "id")

if [ "$BOOK_STATUS" = "201" ]; then
  pass "POST /api/books (admin) returns 201"
else
  fail "POST /api/books (admin) returns 201 (got: $BOOK_STATUS)"
fi

# Register customer and place order
http_post "$BASE/api/auth/register" '{"username":"prod_customer","password":"password123"}' > /dev/null
RESULT=$(http_post "$BASE/api/auth/login" '{"username":"prod_customer","password":"password123"}')
CUSTOMER_TOKEN=$(extract_json_field "$(echo "$RESULT" | cut -d'|' -f2-)" "token")

RESULT=$(http_post "$BASE/api/orders" "{\"bookId\":$BOOK_ID,\"quantity\":1}" "Bearer $CUSTOMER_TOKEN")
ORDER_STATUS=$(echo "$RESULT" | cut -d'|' -f1)

if [ "$ORDER_STATUS" = "202" ]; then
  pass "POST /api/orders returns 202 Accepted"
else
  fail "POST /api/orders returns 202 Accepted (got: $ORDER_STATUS)"
fi

check_result
