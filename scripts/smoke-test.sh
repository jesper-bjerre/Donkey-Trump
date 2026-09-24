#!/usr/bin/env bash
# Post-deploy smoke test for the static game. Fails closed: any unexpected status,
# missing app shell marker, missing asset or missing security header exits non-zero.
# Usage: scripts/smoke-test.sh https://example.azurestaticapps.net
set -euo pipefail

BASE_URL="${1:?usage: smoke-test.sh <base-url>}"
BASE_URL="${BASE_URL%/}"
ATTEMPTS="${SMOKE_ATTEMPTS:-10}"
DELAY="${SMOKE_DELAY_SECONDS:-10}"

fail() {
  echo "::error::Smoke test failed: $*"
  exit 1
}

# The CDN can take a moment to serve a fresh deployment, so retry the shell first.
status=""
for attempt in $(seq 1 "$ATTEMPTS"); do
  status="$(curl --fail --silent --location --max-time 15 --output /tmp/smoke-index.html --write-out '%{http_code}' "$BASE_URL/" || true)"
  [ "$status" = "200" ] && break
  echo "Attempt $attempt/$ATTEMPTS: GET $BASE_URL/ returned ${status:-no response}; retrying in ${DELAY}s"
  sleep "$DELAY"
done
[ "$status" = "200" ] || fail "GET $BASE_URL/ returned ${status:-no response}"

grep -q 'id="game"' /tmp/smoke-index.html || fail "app shell is missing the #game container"
echo "App shell OK (HTTP 200, #game container present)"

asset="$(grep -oE '(\./)?assets/[^"]+\.js' /tmp/smoke-index.html | head -n 1 | sed 's#^\./##')"
[ -n "$asset" ] || fail "no JavaScript asset referenced from index.html"
asset_status="$(curl --fail --silent --max-time 15 --output /dev/null --write-out '%{http_code}' "$BASE_URL/$asset")"
[ "$asset_status" = "200" ] || fail "GET /$asset returned $asset_status"
echo "Static asset OK ($asset)"

headers="$(curl --fail --silent --show-error --head --max-time 15 "$BASE_URL/")"
for header in content-security-policy strict-transport-security x-content-type-options; do
  grep -qi "^$header:" <<<"$headers" || fail "response is missing the $header header"
done
echo "Security headers OK"
echo "Smoke test passed for $BASE_URL"
