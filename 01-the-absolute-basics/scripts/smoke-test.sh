#!/usr/bin/env bash
# Module 01: Smoke Test — CLI Book Parser
# Validates the processData function works with valid and invalid input.
# Uses CJS mode to avoid ESM `require.main` guard issue in the source.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$MODULE_DIR/../scripts/smoke-lib.sh"

cd "$MODULE_DIR"
require_commands node jq

echo -e "${CYAN}Module 01: The Absolute Basics — CLI Smoke Test${NC}"
echo ""

# Helper: run processData via a CJS runner in the module directory
run_process_data() {
  local input_file="$1"
  local output_file="$2"
  local runner="$MODULE_DIR/.smoke-runner.cjs"

  cat > "$runner" <<SCRIPT
require('tsx/cjs');
const { processData } = require('./after/index.ts');
processData('${input_file}', '${output_file}').then(() => process.exit(0)).catch(() => process.exit(1));
SCRIPT

  node "$runner" > /dev/null 2>&1
  local rc=$?
  rm -f "$runner"
  return $rc
}

# ── Test 1: Valid input produces output file ────────────────────────
VALID_INPUT=$(mktemp)
OUTPUT_FILE=$(mktemp)
rm -f "$OUTPUT_FILE"

cat > "$VALID_INPUT" <<'JSON'
[
  {"id": 1, "title": "Test Book", "author": "Author", "pages": 100, "published": "2023"},
  {"id": 2, "title": "Another Book", "author": "Writer", "pages": 200, "published": "2024"}
]
JSON

if run_process_data "$VALID_INPUT" "$OUTPUT_FILE"; then
  pass "processData exits 0 with valid input"
else
  fail "processData exits 0 with valid input"
fi

if [ -f "$OUTPUT_FILE" ]; then
  COUNT=$(jq length "$OUTPUT_FILE" 2>/dev/null)
  if [ "$COUNT" = "2" ]; then
    pass "Output file contains 2 validated books"
  else
    fail "Output file contains 2 validated books (got: $COUNT)"
  fi
else
  fail "Output file was created"
fi

# ── Test 2: Invalid input causes non-zero exit ─────────────────────
INVALID_INPUT=$(mktemp)
INVALID_OUTPUT=$(mktemp)
rm -f "$INVALID_OUTPUT"

cat > "$INVALID_INPUT" <<'JSON'
[
  {"id": 1, "title": "", "author": "Bad", "pages": 100, "published": "2023"}
]
JSON

if run_process_data "$INVALID_INPUT" "$INVALID_OUTPUT"; then
  fail "processData exits non-zero with invalid input"
else
  pass "processData exits non-zero with invalid input"
fi

# ── Test 3: Missing input file causes non-zero exit ─────────────────
if run_process_data "/nonexistent/file.json" "/tmp/smoke-no-output.json"; then
  fail "processData exits non-zero with missing input file"
else
  pass "processData exits non-zero with missing input file"
fi

# ── Cleanup ─────────────────────────────────────────────────────────
rm -f "$VALID_INPUT" "$OUTPUT_FILE" "$INVALID_INPUT" "$INVALID_OUTPUT" "$MODULE_DIR/.smoke-runner.cjs"

check_result
