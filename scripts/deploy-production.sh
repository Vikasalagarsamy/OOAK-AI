#!/bin/bash

echo "🚀 OOAK Future - Production Deployment Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROD_PORT=4000
DEV_PORT=3000
PROD_DB_NAME="ooak_future_production"
DEV_DB_NAME="ooak_future"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  - Production Port: $PROD_PORT"
echo "  - Development Port: $DEV_PORT"
echo "  - Production DB: $PROD_DB_NAME"
echo "  - Development DB: $DEV_DB_NAME"
echo ""

# Step 1: Build Production Application
echo -e "${YELLOW}🔨 Step 1: Building production application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Ensure Production Database Exists
echo -e "${YELLOW}🗄️  Step 2: Setting up production database...${NC}"
psql -h localhost -p 5432 -U vikasalagarsamy -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$PROD_DB_NAME'" | grep -q 1
if [ $? -ne 0 ]; then
    echo "Creating production database..."
    createdb -h localhost -p 5432 -U vikasalagarsamy $PROD_DB_NAME
    echo -e "${GREEN}✅ Production database created${NC}"
else
    echo -e "${GREEN}✅ Production database already exists${NC}"
fi

# Step 3: Initial Data Sync
echo -e "${YELLOW}🔄 Step 3: Initial data synchronization...${NC}"
node scripts/production-sync-advanced.cjs sync
echo -e "${GREEN}✅ Initial sync completed${NC}"

# Step 4: Start Production Application
echo -e "${YELLOW}🚀 Step 4: Starting production application...${NC}"

# Kill existing production process if running
pkill -f "next start.*$PROD_PORT" 2>/dev/null || true

# Start production server
export NODE_ENV=production
export PORT=$PROD_PORT
export POSTGRES_DATABASE=$PROD_DB_NAME

nohup npm start -- -p $PROD_PORT > logs/production.log 2>&1 &
PROD_PID=$!

# Wait a moment for startup
sleep 3

# Check if production server is running
if ps -p $PROD_PID > /dev/null; then
    echo -e "${GREEN}✅ Production application started (PID: $PROD_PID)${NC}"
    echo -e "${GREEN}🌐 Production URL: http://localhost:$PROD_PORT${NC}"
else
    echo -e "${RED}❌ Failed to start production application${NC}"
    exit 1
fi

# Step 5: Start Continuous Sync
echo -e "${YELLOW}🔄 Step 5: Starting continuous sync service...${NC}"

# Kill existing sync process if running
pkill -f "production-sync-advanced.cjs watch" 2>/dev/null || true

# Start sync service
nohup node scripts/production-sync-advanced.cjs watch > logs/sync-service.log 2>&1 &
SYNC_PID=$!

# Wait a moment for startup
sleep 2

if ps -p $SYNC_PID > /dev/null; then
    echo -e "${GREEN}✅ Sync service started (PID: $SYNC_PID)${NC}"
    echo -e "${GREEN}⏰ Syncing every 10 minutes${NC}"
else
    echo -e "${RED}❌ Failed to start sync service${NC}"
fi

# Step 6: Health Check
echo -e "${YELLOW}🏥 Step 6: Health check...${NC}"
sleep 5

# Check production application health
curl -s http://localhost:$PROD_PORT > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Production application is healthy${NC}"
else
    echo -e "${RED}❌ Production application health check failed${NC}"
fi

# Step 7: Summary
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "=============================="
echo -e "${GREEN}✅ Production Application:${NC} http://localhost:$PROD_PORT"
echo -e "${GREEN}✅ Development Application:${NC} http://localhost:$DEV_PORT"
echo -e "${GREEN}✅ Production Database:${NC} $PROD_DB_NAME"
echo -e "${GREEN}✅ Sync Service:${NC} Running (10-minute intervals)"
echo ""
echo -e "${BLUE}📝 Process IDs:${NC}"
echo "  - Production App PID: $PROD_PID"
echo "  - Sync Service PID: $SYNC_PID"
echo ""
echo -e "${BLUE}📁 Log Files:${NC}"
echo "  - Production App: logs/production.log"
echo "  - Sync Service: logs/sync-service.log"
echo "  - Sync Operations: logs/production-sync.log"
echo ""
echo -e "${YELLOW}🎯 Next Steps:${NC}"
echo "  1. Share production URL with your India team: http://localhost:$PROD_PORT"
echo "  2. Monitor logs: tail -f logs/production.log"
echo "  3. Check sync status: node scripts/production-sync-advanced.cjs status"
echo "  4. Restore from production if needed: node scripts/production-sync-advanced.cjs restore"
echo ""
echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"

# Save process IDs for later management
echo "PROD_PID=$PROD_PID" > .production-pids
echo "SYNC_PID=$SYNC_PID" >> .production-pids

echo -e "${BLUE}💡 Management Commands:${NC}"
echo "  - Stop production: ./scripts/stop-production.sh"
echo "  - Restart production: ./scripts/restart-production.sh"
echo "  - View status: ./scripts/production-status.sh" 