#!/usr/bin/env bash
# smoke-all.sh — Run all module smoke tests sequentially
# Usage: bash scripts/smoke-all.sh [module_number]
#   No args  → runs all 16 modules
#   With arg → runs only that module (e.g., "bash scripts/smoke-all.sh 03")

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

MODULES=(
  "01-the-absolute-basics"
  "02-servers-from-scratch"
  "03-rest-apis-and-express"
  "04-data-persistence-postgresql"
  "05-auth-and-security"
  "06-professional-testing-workflows"
  "07-background-jobs"
  "08-caching-and-optimization"
  "09-ddd-functional-architecture"
  "10-microservices-and-events"
  "11-ship-it"
  "12-api-hardening"
  "13-realtime-websockets"
  "14-observability"
  "15-release-contracts-resilience"
  "16-release-engineering-contracts"
)

PASSED=()
FAILED=()
SKIPPED=()

between_modules_cleanup() {
  # Kill any leftover processes on common ports
  for port in 3000 3001 3150 3160 4150 5173 5432 5437 5450 5460 6385 6395 6379; do
    lsof -ti ":$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
  done
  # Stop any lingering docker compose services from any module
  for dir in "$ROOT_DIR"/*/; do
    if [ -f "$dir/docker-compose.yml" ]; then
      (cd "$dir" && docker compose down -v 2>/dev/null) || true
    fi
  done
  sleep 1
}

run_module_smoke() {
  local module="$1"
  local module_dir="$ROOT_DIR/$module"
  local smoke_script="$module_dir/scripts/smoke-test.sh"

  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $module${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [ ! -f "$smoke_script" ]; then
    echo -e "  ${YELLOW}SKIP${NC} — no scripts/smoke-test.sh found"
    SKIPPED+=("$module")
    return 0
  fi

  if [ ! -d "$module_dir/node_modules" ]; then
    echo -e "  ${YELLOW}Installing dependencies...${NC}"
    (cd "$module_dir" && npm install --silent 2>/dev/null)
  fi

  if bash "$smoke_script"; then
    PASSED+=("$module")
  else
    FAILED+=("$module")
  fi

  between_modules_cleanup
}

# ── Filter by module number if provided ─────────────────────────────
if [ "${1:-}" != "" ]; then
  FILTER="$1"
  FILTERED=()
  for m in "${MODULES[@]}"; do
    if [[ "$m" == "$FILTER"* ]]; then
      FILTERED+=("$m")
    fi
  done
  if [ ${#FILTERED[@]} -eq 0 ]; then
    echo -e "${RED}No module matching '$FILTER'${NC}"
    exit 1
  fi
  MODULES=("${FILTERED[@]}")
fi

echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        Backend Masterclass — Smoke Tests            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo -e "Running ${#MODULES[@]} module(s)..."

for module in "${MODULES[@]}"; do
  run_module_smoke "$module"
done

# ── Summary ─────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    SUMMARY                          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"

if [ ${#PASSED[@]} -gt 0 ]; then
  echo -e "${GREEN}Passed (${#PASSED[@]}):${NC}"
  for m in "${PASSED[@]}"; do
    echo -e "  ${GREEN}✓${NC} $m"
  done
fi

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo -e "${YELLOW}Skipped (${#SKIPPED[@]}):${NC}"
  for m in "${SKIPPED[@]}"; do
    echo -e "  ${YELLOW}○${NC} $m"
  done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo -e "${RED}Failed (${#FAILED[@]}):${NC}"
  for m in "${FAILED[@]}"; do
    echo -e "  ${RED}✗${NC} $m"
  done
  echo ""
  echo -e "${RED}SOME SMOKE TESTS FAILED${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}ALL SMOKE TESTS PASSED${NC}"
