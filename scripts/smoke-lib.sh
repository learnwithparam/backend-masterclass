#!/usr/bin/env bash
# smoke-lib.sh — Shared functions for E2E smoke tests
# Source this file from per-module smoke-test.sh scripts.

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Counters ────────────────────────────────────────────────────────
PASS_COUNT=0
FAIL_COUNT=0

# ── PIDs to clean up ───────────────────────────────────────────────
SMOKE_PIDS=()

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo -e "  ${GREEN}✓${NC} $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo -e "  ${RED}✗${NC} $1"
}

check_result() {
  echo ""
  echo -e "${CYAN}Results: ${GREEN}${PASS_COUNT} passed${NC}, ${RED}${FAIL_COUNT} failed${NC}"
  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}SMOKE TEST FAILED${NC}"
    exit 1
  else
    echo -e "${GREEN}SMOKE TEST PASSED${NC}"
    exit 0
  fi
}

# wait_for_port host port [retries=30] [delay=1]
wait_for_port() {
  local host="$1"
  local port="$2"
  local retries="${3:-30}"
  local delay="${4:-1}"

  for i in $(seq 1 "$retries"); do
    if nc -z "$host" "$port" 2>/dev/null; then
      return 0
    fi
    sleep "$delay"
  done
  echo -e "${RED}Timed out waiting for ${host}:${port}${NC}"
  return 1
}

# wait_for_http url [retries=30] [delay=1]
wait_for_http() {
  local url="$1"
  local retries="${2:-30}"
  local delay="${3:-1}"

  for i in $(seq 1 "$retries"); do
    if curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null | grep -q "^[23]"; then
      return 0
    fi
    sleep "$delay"
  done
  echo -e "${RED}Timed out waiting for HTTP at ${url}${NC}"
  return 1
}

# require_commands cmd1 cmd2 ...
require_commands() {
  for cmd in "$@"; do
    if ! command -v "$cmd" &> /dev/null; then
      echo -e "${RED}Required command not found: ${cmd}${NC}"
      exit 1
    fi
  done
}

# start_server "command" port [host=localhost]
# Runs command in background, waits for port, stores PID in SMOKE_PIDS
start_server() {
  local cmd="$1"
  local port="$2"
  local host="${3:-localhost}"

  eval "$cmd" &
  local pid=$!
  SMOKE_PIDS+=("$pid")

  if ! wait_for_port "$host" "$port" 30 1; then
    echo -e "${RED}Server failed to start on port ${port}${NC}"
    kill "$pid" 2>/dev/null || true
    return 1
  fi
}

# start_tsx_server "entry.ts" port [start_fn_call]
# Workaround: `require.main === module` doesn't work in ESM + Node 25.
# Creates a .cjs wrapper that imports the module via tsx/cjs and calls startServer().
start_tsx_server() {
  local entry="$1"
  local port="$2"
  local start_call="${3:-startServer($port)}"
  local wrapper=".smoke-server-$port.cjs"

  cat > "$wrapper" <<WRAPPER
require('tsx/cjs');
const mod = require('./${entry}');
if (mod.startServer) mod.${start_call};
WRAPPER

  node "$wrapper" > /dev/null 2>&1 &
  local pid=$!
  SMOKE_PIDS+=("$pid")

  # Track wrapper for cleanup
  SMOKE_WRAPPERS="${SMOKE_WRAPPERS:-} $wrapper"

  if ! wait_for_port "localhost" "$port" 30 1; then
    echo -e "${RED}Server failed to start on port ${port}${NC}"
    kill "$pid" 2>/dev/null || true
    return 1
  fi
}

# start_tsx_worker "entry.ts"
# Same CJS wrapper approach but for worker processes (no port to wait for).
start_tsx_worker() {
  local entry="$1"
  local wrapper=".smoke-worker-$$.cjs"

  cat > "$wrapper" <<WRAPPER
require('tsx/cjs');
require('./${entry}');
WRAPPER

  node "$wrapper" > /dev/null 2>&1 &
  local pid=$!
  SMOKE_PIDS+=("$pid")
  SMOKE_WRAPPERS="${SMOKE_WRAPPERS:-} $wrapper"
}

# cleanup — kill all tracked PIDs + optional docker compose down
cleanup() {
  for pid in "${SMOKE_PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
  SMOKE_PIDS=()

  # Remove temporary wrapper files
  for f in ${SMOKE_WRAPPERS:-}; do
    rm -f "$f" 2>/dev/null || true
  done

  # If SMOKE_DOCKER_COMPOSE is set, tear down containers
  if [ "${SMOKE_DOCKER_COMPOSE:-}" = "1" ]; then
    docker compose down -v 2>/dev/null || true
  fi
}

# Register cleanup on EXIT
trap cleanup EXIT

# docker_up — start docker compose and wait for services
docker_up() {
  SMOKE_DOCKER_COMPOSE=1
  docker compose up -d
  echo -e "${YELLOW}Waiting for Docker services...${NC}"
  sleep 5
}

# db_push — push drizzle schema
db_push() {
  npx drizzle-kit push 2>/dev/null || npx drizzle-kit push
}

# ── HTTP helpers ────────────────────────────────────────────────────

# http_get url — returns HTTP status code
http_get() {
  local url="$1"
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null)
  echo "$status"
}

# http_get_body url
http_get_body() {
  curl -sf "$1" 2>/dev/null
}

# http_post url data [auth_header]
# Returns "status_code|body"
http_post() {
  local url="$1"
  local data="$2"
  local auth="${3:-}"
  local response

  if [ -n "$auth" ]; then
    response=$(curl -s -w '\n%{http_code}' -X POST -H "Content-Type: application/json" -H "Authorization: $auth" -d "$data" "$url" 2>/dev/null)
  else
    response=$(curl -s -w '\n%{http_code}' -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
  fi

  local body status
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  echo "${status}|${body}"
}

# http_delete url [auth_header]
http_delete() {
  local url="$1"
  local auth="${2:-}"
  local status

  if [ -n "$auth" ]; then
    status=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE -H "Authorization: $auth" "$url" 2>/dev/null)
  else
    status=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "$url" 2>/dev/null)
  fi
  echo "$status"
}

# extract_json_field "json_string" "field"
extract_json_field() {
  echo "$1" | jq -r ".$2" 2>/dev/null
}

echo -e "${CYAN}smoke-lib loaded${NC}"
