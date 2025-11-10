#!/bin/bash

# Manual health check script
# Tests a URL and shows the result

if [ -z "$1" ]; then
    echo "Usage: ./manual-health-check.sh <URL>"
    echo "Example: ./manual-health-check.sh https://www.google.com"
    exit 1
fi

URL=$1
TIMEOUT=${2:-10}

echo "Testing: $URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

START=$(date +%s.%N)

# Perform HTTP check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL" 2>&1)
CURL_EXIT=$?

END=$(date +%s.%N)
RESPONSE_TIME=$(echo "$END - $START" | bc)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $CURL_EXIT -eq 0 ] && [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo "✅ Status: UP"
    echo "📊 HTTP Code: $HTTP_CODE"
    printf "⏱️  Response Time: %.3fs\n" $RESPONSE_TIME
else
    echo "❌ Status: DOWN"
    if [ $CURL_EXIT -ne 0 ]; then
        echo "🔴 Error: Connection failed (timeout or DNS error)"
    else
        echo "🔴 HTTP Code: $HTTP_CODE"
    fi
    printf "⏱️  Response Time: %.3fs\n" $RESPONSE_TIME
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

