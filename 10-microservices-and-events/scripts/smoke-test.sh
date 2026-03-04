#!/usr/bin/env bash
# Module 10: Smoke Test — Two Microservices (Order + Inventory)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc docker

ORDER_PORT=3000
INVENTORY_PORT=4000
BASE="http://localhost:${ORDER_PORT}"
echo -e "${CYAN}Module 10: Microservices and Events — Smoke Test${NC}"
echo ""

docker_up
db_push

# ── Start both microservices ────────────────────────────────────────
start_tsx_server "after/order-service/index.ts" "$ORDER_PORT"

# Inventory service starts unconditionally, use start_tsx_worker approach
# but it listens on a port, so use a custom CJS wrapper
INVENTORY_WRAPPER=".smoke-inventory.cjs"
cat > "$INVENTORY_WRAPPER" <<'WRAPPER'
require('tsx/cjs');
require('./after/inventory-service/index.ts');
WRAPPER
SMOKE_WRAPPERS="${SMOKE_WRAPPERS:-} $INVENTORY_WRAPPER"

node "$INVENTORY_WRAPPER" > /dev/null 2>&1 &
SMOKE_PIDS+=("$!")
wait_for_port "localhost" "$INVENTORY_PORT" 30 1

# ── Test 1: Health check on inventory-service ───────────────────────
STATUS=$(http_get "http://localhost:${INVENTORY_PORT}/health")
if [ "$STATUS" = "200" ]; then pass "GET /health on inventory-service returns 200"; else fail "GET /health on inventory-service returns 200 (got: $STATUS)"; fi

# ── Register + login ───────────────────────────────────────────────
http_post "$BASE/api/auth/register" '{"username":"micro_admin","password":"password123"}' > /dev/null
docker compose exec -T db psql -U user -d bookstore -c "UPDATE users SET role='admin' WHERE username='micro_admin';" > /dev/null 2>&1

RESULT=$(http_post "$BASE/api/auth/login" '{"username":"micro_admin","password":"password123"}')
ADMIN_TOKEN=$(extract_json_field "$(echo "$RESULT" | cut -d'|' -f2-)" "token")

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
  pass "Admin registered and logged in"
else
  fail "Admin registered and logged in"
fi

# ── Create a book ───────────────────────────────────────────────────
RESULT=$(http_post "$BASE/api/books" '{"title":"Microservices Book","author":"Tester","pages":300,"published":"2024"}' "Bearer $ADMIN_TOKEN")
BOOK_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
BOOK_BODY=$(echo "$RESULT" | cut -d'|' -f2-)
BOOK_ID=$(extract_json_field "$BOOK_BODY" "id")

if [ "$BOOK_STATUS" = "201" ]; then pass "POST /api/books (admin) returns 201"; else fail "POST /api/books (admin) returns 201 (got: $BOOK_STATUS)"; fi

# ── Place an order as customer → 202 ───────────────────────────────
http_post "$BASE/api/auth/register" '{"username":"micro_customer","password":"password123"}' > /dev/null
RESULT=$(http_post "$BASE/api/auth/login" '{"username":"micro_customer","password":"password123"}')
CUSTOMER_TOKEN=$(extract_json_field "$(echo "$RESULT" | cut -d'|' -f2-)" "token")

RESULT=$(http_post "$BASE/api/orders" "{\"bookId\":$BOOK_ID,\"quantity\":2}" "Bearer $CUSTOMER_TOKEN")
ORDER_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
ORDER_BODY=$(echo "$RESULT" | cut -d'|' -f2-)

if [ "$ORDER_STATUS" = "202" ]; then pass "POST /api/orders returns 202 Accepted"; else fail "POST /api/orders returns 202 Accepted (got: $ORDER_STATUS)"; fi

ORDER_PENDING=$(extract_json_field "$ORDER_BODY" "order.status")
if [ "$ORDER_PENDING" = "pending" ]; then pass "Order initial status is 'pending'"; else fail "Order initial status is 'pending' (got: $ORDER_PENDING)"; fi

check_result
