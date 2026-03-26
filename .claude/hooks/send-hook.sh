#!/bin/bash
# Send hook event to Agent HQ server

SERVER_URL="${SERVER_URL:-http://localhost:3001}"

# Read JSON from stdin
PAYLOAD=$(cat)

if [ -z "$PAYLOAD" ]; then
  echo "No payload received"
  exit 0
fi

# Send to server
curl -s -X POST "$SERVER_URL/api/hooks" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" > /dev/null 2>&1

exit 0