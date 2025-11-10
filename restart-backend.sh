#!/bin/bash

# Stop any running backend process on port 8080
PID=$(lsof -t -i:8080 2>/dev/null)
if [ -n "$PID" ]; then
  echo "Stopping backend server (PID: $PID)..."
  kill -9 "$PID"
  sleep 1
  echo "Backend server stopped."
else
  echo "No backend server running on port 8080."
fi

# Start the backend server
echo "Starting backend server..."
cd backend && go run cmd/api/main.go &
echo "Backend server started in the background."
echo "You can check its status with: lsof -i:8080"
echo "Or check its health with: curl http://localhost:8080/api/v1/health"
echo ""
echo "New routes available:"
echo "  - GET /api/v1/predictions (protected)"
echo "  - GET /api/v1/services/:id/prediction (protected)"
echo "  - GET /api/v1/metrics (public - Prometheus format)"

