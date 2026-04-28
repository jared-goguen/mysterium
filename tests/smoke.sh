#!/usr/bin/env bash
#
# smoke.sh — Post-deploy verification
#
# Usage:
#   ./tests/smoke.sh                          # uses https://mysterium.pages.dev
#   ./tests/smoke.sh https://phase2.mysterium.pages.dev
#   ./tests/smoke.sh http://localhost:8788    # local wrangler dev
#
# Exits 0 if all checks pass, 1 on first failure.

set -euo pipefail

BASE="${1:-https://mysterium.pages.dev}"
PASS=0
FAIL=0

check() {
  local name="$1" url="$2" method="${3:-GET}" body="${4:-}"
  local args=(-s -w "\n%{http_code}" -X "$method")
  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi

  local response
  response=$(curl "${args[@]}" "$url")
  local status
  status=$(echo "$response" | tail -1)
  local body_out
  body_out=$(echo "$response" | sed '$d')

  if [[ "$status" =~ ^2 ]]; then
    echo "  ✓ $name ($status)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name ($status)"
    echo "    $body_out" | head -3
    FAIL=$((FAIL + 1))
  fi
}

echo "Smoke testing: $BASE"
echo ""

# 1. Health check — validates runtime, mysteries, API key, node compat
check "GET /api/health" "$BASE/api/health"

# 2. Mystery catalog — should return array of mysteries
check "GET /api/mysteries" "$BASE/api/mysteries"

# 3. Start Blue Parrot — tests registry lookup + state creation + stripping
check "POST /api/start (Blue Parrot)" "$BASE/api/start" POST '{"mysteryId":"blue-parrot-001"}'

# 4. Start Crystal Court — tests second mystery
check "POST /api/start (Crystal Court)" "$BASE/api/start" POST '{"mysteryId":"crystal-court-001"}'

# 5. Start with bad ID — should return 404
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/start" \
  -H "Content-Type: application/json" \
  -d '{"mysteryId":"nonexistent"}')
status=$(echo "$response" | tail -1)
if [[ "$status" == "404" ]]; then
  echo "  ✓ POST /api/start (bad ID → 404)"
  PASS=$((PASS + 1))
else
  echo "  ✗ POST /api/start (bad ID → expected 404, got $status)"
  FAIL=$((FAIL + 1))
fi

# 6. Focus endpoint — navigate without AI call
STATE=$(curl -s -X POST "$BASE/api/start" \
  -H "Content-Type: application/json" \
  -d '{"mysteryId":"blue-parrot-001"}' | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['state']))")
check "POST /api/focus (navigate)" "$BASE/api/focus" POST \
  "{\"mysteryId\":\"blue-parrot-001\",\"state\":$STATE,\"target\":{\"type\":\"location\",\"id\":\"main-floor\"}}"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]]
