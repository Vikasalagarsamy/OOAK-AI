#!/bin/bash

# Universal AI System - STOP ALL SERVICES Script
# ===============================================
# Gracefully stops all running services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${RED}🛑 STOPPING UNIVERSAL AI SYSTEM SERVICES${NC}"
echo "================================================="

# Function to stop process by name
stop_process() {
    local process_name=$1
    local display_name=$2
    
    if pgrep -f "$process_name" > /dev/null; then
        echo -e "${YELLOW}🛑 Stopping $display_name...${NC}"
        pkill -f "$process_name" 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if pgrep -f "$process_name" > /dev/null; then
            echo -e "${YELLOW}⚡ Force stopping $display_name...${NC}"
            pkill -9 -f "$process_name" 2>/dev/null || true
        fi
        
        echo -e "${GREEN}✅ $display_name stopped${NC}"
    else
        echo -e "${BLUE}ℹ️  $display_name is not running${NC}"
    fi
}

# Stop Next.js server
stop_process "next dev" "Next.js server"

# Stop Cloudflare tunnel
stop_process "cloudflared tunnel" "Cloudflare tunnel"

# Stop Ollama service
stop_process "ollama serve" "Ollama LLM service"

# Clear port 3000 just in case
echo -e "${YELLOW}🧹 Clearing port 3000...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Stop Supabase services
echo -e "${CYAN}📊 Stopping Supabase services...${NC}"
if [ -d "supabase/docker" ]; then
    cd supabase/docker
    if docker compose ps | grep -q "Up"; then
        docker compose -f docker-compose.yml -f docker-compose.studio.yml down
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Supabase services stopped${NC}"
        else
            echo -e "${RED}❌ Failed to stop Supabase services${NC}"
        fi
    else
        echo -e "${BLUE}ℹ️  Supabase services are not running${NC}"
    fi
    cd ../..
else
    echo -e "${BLUE}ℹ️  Supabase Docker directory not found${NC}"
fi

# Check if any processes are still running
echo ""
echo -e "${BLUE}🔍 Checking for remaining processes...${NC}"

remaining_processes=0

if pgrep -f "next dev" > /dev/null; then
    echo -e "${RED}⚠️  Next.js still running${NC}"
    remaining_processes=1
fi

if pgrep -f "cloudflared tunnel" > /dev/null; then
    echo -e "${RED}⚠️  Cloudflare tunnel still running${NC}"
    remaining_processes=1
fi

if pgrep -f "ollama serve" > /dev/null; then
    echo -e "${RED}⚠️  Ollama still running${NC}"
    remaining_processes=1
fi

if docker ps | grep -q "supabase"; then
    echo -e "${RED}⚠️  Some Supabase containers still running${NC}"
    remaining_processes=1
fi

if [ $remaining_processes -eq 0 ]; then
    echo -e "${GREEN}✅ All services stopped successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Some processes may still be running${NC}"
    echo -e "${YELLOW}💡 You can run 'ps aux | grep -E \"(next|cloudflared|ollama)\"' to check${NC}"
    echo -e "${YELLOW}💡 You can run 'docker ps' to check Supabase containers${NC}"
fi

echo ""
echo -e "${GREEN}🎯 SYSTEM SHUTDOWN COMPLETE${NC}"
echo "================================================="
echo -e "${BLUE}To restart the system, run: ./start-permanent-ooak.sh${NC}" 