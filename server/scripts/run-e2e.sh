#!/usr/bin/env bash
# End-to-end local x402 payment test.
# Starts the local x402 resource server, waits for it, runs the payment
# client against it, then tears the server down.
#
# Usage:  bash server/scripts/run-e2e.sh [endpoint] [param]
#   e.g.  bash server/scripts/run-e2e.sh weather "San Francisco"
#         bash server/scripts/run-e2e.sh twitter "Algorand x402"
set -u
cd "$(dirname "$0")/.."

PORT=4021
BASE=http://localhost:$PORT

npx tsx src/x402.ts > "${TMPDIR:-/tmp}/x402-local.log" 2>&1 &
SRV=$!
cleanup() { kill -9 "$SRV" 2>/dev/null; }
trap cleanup EXIT

echo "Starting local x402 server (this can take ~45s to cold-compile)..."
for i in $(seq 1 90); do
  if curl -sS -o /dev/null "http://localhost:$PORT/proxy/weather/current" -X POST \
       -H 'Content-Type: application/json' -d '{}' 2>/dev/null; then
    break
  fi
  sleep 1
done

echo "=== Running x402 payment client (local) ==="
AGENTCART_BASE_URL="$BASE" npx tsx src/client.ts "${1:-weather}" "${2:-San Francisco}"
