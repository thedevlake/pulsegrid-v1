#!/bin/bash

# Script to add test services to PulseGrid
# Usage: ./test-services.sh <JWT_TOKEN>

TOKEN=$1
API_URL="http://localhost:8080/api/v1"

if [ -z "$TOKEN" ]; then
    echo "Usage: ./test-services.sh <JWT_TOKEN>"
    echo "Get your JWT token from browser localStorage or login response"
    exit 1
fi

echo "Adding test services to PulseGrid..."
echo ""

# Service 1: Google
echo "Adding Google..."
curl -X POST "$API_URL/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google Homepage",
    "url": "https://www.google.com",
    "type": "http",
    "check_interval": 60,
    "timeout": 10,
    "expected_status_code": 200,
    "tags": ["public", "search"]
  }' | jq '.'
echo ""

# Service 2: GitHub API
echo "Adding GitHub API..."
curl -X POST "$API_URL/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub API",
    "url": "https://api.github.com",
    "type": "http",
    "check_interval": 120,
    "timeout": 10,
    "expected_status_code": 200,
    "tags": ["api", "github"]
  }' | jq '.'
echo ""

# Service 3: JSONPlaceholder
echo "Adding JSONPlaceholder..."
curl -X POST "$API_URL/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "JSONPlaceholder API",
    "url": "https://jsonplaceholder.typicode.com/posts/1",
    "type": "http",
    "check_interval": 180,
    "timeout": 10,
    "expected_status_code": 200,
    "tags": ["api", "test"]
  }' | jq '.'
echo ""

# Service 4: HTTPBin
echo "Adding HTTPBin..."
curl -X POST "$API_URL/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HTTPBin Status",
    "url": "https://httpbin.org/status/200",
    "type": "http",
    "check_interval": 60,
    "timeout": 10,
    "expected_status_code": 200,
    "tags": ["api", "test"]
  }' | jq '.'
echo ""

# Service 5: Down Service (for testing alerts)
echo "Adding Test Down Service..."
curl -X POST "$API_URL/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Down Service",
    "url": "https://this-url-does-not-exist-12345.com",
    "type": "http",
    "check_interval": 60,
    "timeout": 5,
    "expected_status_code": 200,
    "tags": ["test", "down"]
  }' | jq '.'
echo ""

echo "✅ All test services added!"
echo ""
echo "Next steps:"
echo "1. Go to http://localhost:5173/services to see your services"
echo "2. Go to http://localhost:5173/dashboard to see the overview"
echo "3. Wait for health checks to run (or trigger manually)"
echo "4. Check http://localhost:5173/alerts for any alerts"

