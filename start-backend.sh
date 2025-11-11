#!/bin/bash

# Start PulseGrid Backend Server
# This script starts the backend API server

cd "$(dirname "$0")/backend" || exit 1

echo "🚀 Starting PulseGrid Backend Server..."
echo "📍 Server will run on http://localhost:8080"
echo ""

# Check if port 8080 is already in use
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "⚠️  Port 8080 is already in use. Killing existing process..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    sleep 1
    echo "✅ Port 8080 is now free"
    echo ""
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Make sure to configure your environment variables."
fi

# Run the server
go run cmd/api/main.go

