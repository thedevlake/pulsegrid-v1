#!/bin/bash

# Start PulseGrid Health Check Scheduler
# This script starts the scheduler that performs health checks on your services

cd "$(dirname "$0")/backend" || exit 1

echo "🔄 Starting PulseGrid Health Check Scheduler..."
echo "📍 This will check your services every 10 seconds"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Make sure to configure your environment variables."
fi

# Run the scheduler
go run cmd/scheduler/main.go
