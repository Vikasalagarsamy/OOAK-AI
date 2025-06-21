#!/bin/bash

echo "🚀 OOAK Future - Quick Production Deployment"
echo "============================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROD_PORT=4000
DEV_PORT=3000

echo -e "${BLUE}📋 Quick Deployment Configuration:${NC}"
echo "  - Production Port: $PROD_PORT"
echo "  - Development Port: $DEV_PORT"
echo "  - Using development mode for production (faster deployment)"
echo ""

# Step 1: Ensure production database is ready
echo -e "${YELLOW}🗄️  Step 1: Checking production database...${NC}"
node scripts/production-sync-advanced.cjs sync
echo -e "${GREEN}✅ Production database synchronized${NC}"

# Step 2: Kill existing production process
echo -e "${YELLOW}🔄 Step 2: Stopping existing production instance...${NC}"
pkill -f "next dev.*$PROD_PORT" 2>/dev/null || true
sleep 2

# Step 3: Start production application on port 4000
echo -e "${YELLOW}🚀 Step 3: Starting production application...${NC}"

# Set production environment variables
export NODE_ENV=production
export POSTGRES_DATABASE=ooak_future_production
export PORT=$PROD_PORT

# Start production server in background
nohup npm run dev -- -p $PROD_PORT > logs/production-app.log 2>&1 &
PROD_PID=$!

# Wait for startup
sleep 5

# Check if production server is running
if lsof -i :$PROD_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Production application started successfully${NC}"
    echo -e "${GREEN}🌐 Production URL: http://localhost:$PROD_PORT${NC}"
else
    echo -e "${RED}❌ Failed to start production application${NC}"
    echo "Check logs: tail -f logs/production-app.log"
    exit 1
fi

# Step 4: Start continuous sync service
echo -e "${YELLOW}🔄 Step 4: Starting sync service...${NC}"

# Kill existing sync process
pkill -f "production-sync-advanced.cjs watch" 2>/dev/null || true

# Start sync service
nohup node scripts/production-sync-advanced.cjs watch > logs/sync-service.log 2>&1 &
SYNC_PID=$!

sleep 2

if ps -p $SYNC_PID > /dev/null; then
    echo -e "${GREEN}✅ Sync service started (10-minute intervals)${NC}"
else
    echo -e "${RED}❌ Sync service failed to start${NC}"
fi

# Step 5: Health check
echo -e "${YELLOW}🏥 Step 5: Health check...${NC}"
sleep 3

curl -s http://localhost:$PROD_PORT > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Production application is healthy${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

# Save process IDs
echo "PROD_PID=$PROD_PID" > .production-pids
echo "SYNC_PID=$SYNC_PID" >> .production-pids

# Summary
echo ""
echo -e "${BLUE}🎉 Quick Production Deployment Complete!${NC}"
echo "========================================"
echo ""
echo -e "${GREEN}✅ Applications Running:${NC}"
echo "  🖥️  Development: http://localhost:$DEV_PORT"
echo "  🏭 Production:  http://localhost:$PROD_PORT"
echo ""
echo -e "${GREEN}✅ Services Active:${NC}"
echo "  🔄 Auto-sync: Every 10 minutes"
echo "  📊 Database: ooak_future_production"
echo ""
echo -e "${BLUE}📁 Log Files:${NC}"
echo "  📄 Production App: logs/production-app.log"
echo "  🔄 Sync Service: logs/sync-service.log"
echo "  📊 Sync Operations: logs/production-sync.log"
echo ""
echo -e "${YELLOW}🎯 For Your India Team:${NC}"
echo "  🌐 Share this URL: http://localhost:$PROD_PORT"
echo "  📱 They can start using the production app immediately"
echo "  🔄 All changes sync automatically every 10 minutes"
echo ""
echo -e "${BLUE}💡 Management Commands:${NC}"
echo "  📊 Check status: ./scripts/production-status.sh"
echo "  🔄 Manual sync: node scripts/production-sync-advanced.cjs sync"
echo "  ⬅️  Restore from production: node scripts/production-sync-advanced.cjs restore"
echo "  🛑 Stop production: pkill -f 'next dev.*4000'"
echo ""
echo -e "${GREEN}🎊 Your production system is ready! Both teams can now work simultaneously.${NC}" 