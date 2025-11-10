#!/bin/bash

# Start PulseGrid Backend Server
# This script starts the backend API server

cd "$(dirname "$0")/backend" || exit 1

echo "🚀 Starting PulseGrid Backend Server..."
echo "📍 Server will run on http://localhost:8080"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Make sure to configure your environment variables."
fi

# Run the server
go run cmd/api/main.go

