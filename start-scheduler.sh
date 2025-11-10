#!/bin/bash

# Start the health check scheduler
# This runs health checks for all active services automatically

echo "Starting PulseGrid Health Check Scheduler..."
echo "This will check all active services every 10 seconds"
echo "Press Ctrl+C to stop"
echo ""

cd backend
go run cmd/scheduler/main.go

