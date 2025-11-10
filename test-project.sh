#!/bin/bash

echo "🚀 PulseGrid Testing Script"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check PostgreSQL
echo "1. Checking PostgreSQL..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is NOT running${NC}"
    echo "   Start it with: brew services start postgresql@14"
    exit 1
fi

# Check database
echo "2. Checking database..."
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw pulsegrid; then
    echo -e "${GREEN}✅ Database 'pulsegrid' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Database 'pulsegrid' does NOT exist${NC}"
    echo "   Creating database..."
    createdb pulsegrid 2>/dev/null || psql -d postgres -c "CREATE DATABASE pulsegrid;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database created${NC}"
    else
        echo -e "${RED}❌ Failed to create database${NC}"
        echo "   Please create it manually: createdb pulsegrid"
    fi
fi

# Check backend .env
echo "3. Checking backend configuration..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ Backend .env file exists${NC}"
else
    echo -e "${RED}❌ Backend .env file NOT found${NC}"
    echo "   Please create it from .env.example"
    exit 1
fi

# Check backend dependencies
echo "4. Checking backend dependencies..."
cd backend
if go mod download > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Installing backend dependencies...${NC}"
    go mod download
fi

# Test backend compilation
echo "5. Testing backend compilation..."
if go build ./cmd/api/main.go > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend compiles successfully${NC}"
    rm -f main
else
    echo -e "${RED}❌ Backend compilation failed${NC}"
    go build ./cmd/api/main.go
    exit 1
fi
cd ..

# Check frontend .env.local
echo "6. Checking frontend configuration..."
if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✅ Frontend .env.local file exists${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend .env.local NOT found, creating...${NC}"
    echo "VITE_API_URL=http://localhost:8080/api/v1" > frontend/.env.local
    echo -e "${GREEN}✅ Created frontend .env.local${NC}"
fi

# Check frontend dependencies
echo "7. Checking frontend dependencies..."
cd frontend
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Installing frontend dependencies...${NC}"
    npm install
fi
cd ..

echo ""
echo "============================"
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Start backend:  cd backend && go run cmd/api/main.go"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Open browser:   http://localhost:5173"
echo ""
echo "See TESTING_GUIDE.md for detailed testing instructions"

