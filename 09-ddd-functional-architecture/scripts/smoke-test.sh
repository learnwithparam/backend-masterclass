#!/usr/bin/env bash
# Module 09: Smoke Test — Server + Worker (DDD architecture)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node curl jq nc docker

PORT=3000
BASE="http://localhost:${PORT}"
echo -e "${CYAN}Module 09: DDD & Functional Architecture — Smoke Test${NC}"
echo ""

docker_up
db_push

start_tsx_server "after/index.ts" "$PORT"
start_tsx_worker "after/worker.ts"
sleep 2

# ── Register admin + customer ───────────────────────────────────────
http_post "$BASE/api/auth/register" '{"username":"admin09","password":"password123"}' > /dev/null
docker compose exec -T db psql -U user -d bookstore -c "UPDATE users SET role='admin' WHERE username='admin09';" > /dev/null 2>&1

RESULT=$(http_post "$BASE/api/auth/login" '{"username":"admin09","password":"password123"}')
ADMIN_TOKEN=$(extract_json_field "$(echo "$RESULT" | cut -d'|' -f2-)" "token")

http_post "$BASE/api/auth/register" '{"username":"customer09","password":"password123"}' > /dev/null
RESULT=$(http_post "$BASE/api/auth/login" '{"username":"customer09","password":"password123"}')
CUSTOMER_TOKEN=$(extract_json_field "$(echo "$RESULT" | cut -d'|' -f2-)" "token")

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then pass "Admin registered and logged in"; else fail "Admin registered and logged in"; fi
if [ -n "$CUSTOMER_TOKEN" ] && [ "$CUSTOMER_TOKEN" != "null" ]; then pass "Customer registered and logged in"; else fail "Customer registered and logged in"; fi

# ── Create a book as admin ──────────────────────────────────────────
RESULT=$(http_post "$BASE/api/books" '{"title":"DDD Test Book","author":"Tester","pages":200,"published":"2024"}' "Bearer $ADMIN_TOKEN")
BOOK_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
BOOK_BODY=$(echo "$RESULT" | cut -d'|' -f2-)
BOOK_ID=$(extract_json_field "$BOOK_BODY" "id")

if [ "$BOOK_STATUS" = "201" ]; then pass "POST /api/books (admin) returns 201"; else fail "POST /api/books (admin) returns 201 (got: $BOOK_STATUS)"; fi

# ── Place an order as customer → 202 ───────────────────────────────
RESULT=$(http_post "$BASE/api/orders" "{\"bookId\":$BOOK_ID,\"quantity\":2}" "Bearer $CUSTOMER_TOKEN")
ORDER_STATUS=$(echo "$RESULT" | cut -d'|' -f1)
ORDER_BODY=$(echo "$RESULT" | cut -d'|' -f2-)

if [ "$ORDER_STATUS" = "202" ]; then pass "POST /api/orders returns 202 Accepted"; else fail "POST /api/orders returns 202 Accepted (got: $ORDER_STATUS)"; fi

ORDER_ID=$(extract_json_field "$ORDER_BODY" "order.id")
INITIAL_STATUS=$(extract_json_field "$ORDER_BODY" "order.status")
if [ "$INITIAL_STATUS" = "pending" ]; then pass "Order initial status is 'pending'"; else fail "Order initial status is 'pending' (got: $INITIAL_STATUS)"; fi

echo -e "  ${YELLOW}Waiting 5s for worker to process order...${NC}"
sleep 5

if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
  ORDER_CHECK=$(curl -sf -H "Authorization: Bearer $CUSTOMER_TOKEN" "$BASE/api/orders/$ORDER_ID" 2>/dev/null)
  FINAL_STATUS=$(extract_json_field "$ORDER_CHECK" "status")
  if [ "$FINAL_STATUS" = "completed" ]; then pass "Order status changed to 'completed'"; else fail "Order status changed to 'completed' (got: $FINAL_STATUS)"; fi
else
  fail "Could not extract order ID"
fi

check_result
