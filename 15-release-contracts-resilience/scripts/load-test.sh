#!/usr/bin/env bash
# Load test for the release/resilience chapter.
# Exercises the public API enough to catch obvious regressions without
# turning the smoke suite into a long-running benchmark.

set -euo pipefail

BASE="${BASE:-http://localhost:3150}"
REQUESTS="${REQUESTS:-20}"

ok=0
for _ in $(seq 1 "$REQUESTS"); do
  status=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/books" 2>/dev/null || echo 000)
  if [ "$status" = "200" ]; then
    ok=$((ok + 1))
  fi
done

if [ "$ok" -lt "$REQUESTS" ]; then
  echo "Load test failed: $ok/$REQUESTS requests succeeded"
  exit 1
fi

echo "Load test passed: $ok/$REQUESTS requests succeeded"
