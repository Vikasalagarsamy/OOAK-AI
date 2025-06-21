#!/bin/bash

echo "📊 OOAK Future - Production Status"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if production PIDs file exists
if [ -f ".production-pids" ]; then
    source .production-pids
else
    echo -e "${YELLOW}⚠️ No production PIDs found. Production may not be running.${NC}"
    PROD_PID=""
    SYNC_PID=""
fi

echo -e "${BLUE}🖥️  Application Status:${NC}"
echo "========================"

# Check Development Server (Port 3000)
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Development Server: Running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Development Server: Not running${NC}"
fi

# Check Production Server (Port 4000)
if lsof -i :4000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Production Server: Running on http://localhost:4000${NC}"
    if [ ! -z "$PROD_PID" ] && ps -p $PROD_PID > /dev/null; then
        echo -e "   ${BLUE}Process ID: $PROD_PID${NC}"
    fi
else
    echo -e "${RED}❌ Production Server: Not running${NC}"
fi

echo ""
echo -e "${BLUE}🔄 Sync Service Status:${NC}"
echo "======================"

# Check Sync Service
if [ ! -z "$SYNC_PID" ] && ps -p $SYNC_PID > /dev/null; then
    echo -e "${GREEN}✅ Sync Service: Running (PID: $SYNC_PID)${NC}"
    echo -e "   ${BLUE}Interval: Every 10 minutes${NC}"
else
    echo -e "${RED}❌ Sync Service: Not running${NC}"
fi

echo ""
echo -e "${BLUE}🗄️  Database Status:${NC}"
echo "==================="

# Check database connections
psql -h localhost -p 5432 -U vikasalagarsamy -d ooak_future -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Development Database: Connected${NC}"
else
    echo -e "${RED}❌ Development Database: Connection failed${NC}"
fi

psql -h localhost -p 5432 -U vikasalagarsamy -d ooak_future_production -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Production Database: Connected${NC}"
else
    echo -e "${RED}❌ Production Database: Connection failed${NC}"
fi

echo ""
echo -e "${BLUE}📊 Database Sync Status:${NC}"
echo "========================"

# Run sync status check
node scripts/production-sync-advanced.cjs status 2>/dev/null || echo -e "${RED}❌ Unable to check sync status${NC}"

echo ""
echo -e "${BLUE}📁 Recent Log Activity:${NC}"
echo "======================="

# Show recent production logs
if [ -f "logs/production.log" ]; then
    echo -e "${YELLOW}📄 Production App (last 5 lines):${NC}"
    tail -n 5 logs/production.log | sed 's/^/   /'
else
    echo -e "${RED}❌ No production logs found${NC}"
fi

echo ""

# Show recent sync logs
if [ -f "logs/sync-service.log" ]; then
    echo -e "${YELLOW}🔄 Sync Service (last 3 lines):${NC}"
    tail -n 3 logs/sync-service.log | sed 's/^/   /'
else
    echo -e "${RED}❌ No sync logs found${NC}"
fi

echo ""
echo -e "${BLUE}💾 Disk Usage:${NC}"
echo "=============="
df -h . | tail -n 1 | awk '{print "   Available: " $4 " (" $5 " used)"}'

echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "======================="
echo "   ./scripts/deploy-production.sh    - Deploy/restart production"
echo "   ./scripts/stop-production.sh      - Stop production services"
echo "   ./scripts/production-logs.sh      - View live logs"
echo "   node scripts/production-sync-advanced.cjs sync   - Manual sync"
echo "   node scripts/production-sync-advanced.cjs restore - Restore from production" 