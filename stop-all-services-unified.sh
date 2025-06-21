#!/bin/bash

# 🛑 OOAK UNIFIED SYSTEM - STOP ALL SERVICES
# ===========================================
# Gracefully stops all services in the unified PostgreSQL architecture

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${RED}🛑 STOPPING OOAK UNIFIED SYSTEM${NC}"
echo "======================================="

# Service Ports
PORT_WHATSAPP=3000
PORT_WORKSPACE=4000
PORT_DEVELOPMENT=5000
PORT_OLLAMA=11434

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

# Function to stop service by port
stop_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}🛑 Stopping $service_name (port $port)...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ $service_name stopped${NC}"
    else
        echo -e "${BLUE}ℹ️  $service_name (port $port) is not running${NC}"
    fi
}

echo -e "${CYAN}🖥️ Stopping Application Services...${NC}"

# Stop all Next.js services
stop_process "next dev.*$PORT_WHATSAPP" "WhatsApp service (port $PORT_WHATSAPP)"
stop_process "next dev.*$PORT_WORKSPACE" "Workspace service (port $PORT_WORKSPACE)"
stop_process "next dev.*$PORT_DEVELOPMENT" "Development service (port $PORT_DEVELOPMENT)"

# Force stop by port if needed
stop_port $PORT_WHATSAPP "WhatsApp service"
stop_port $PORT_WORKSPACE "Workspace service"
stop_port $PORT_DEVELOPMENT "Development service"

echo -e "${CYAN}🌐 Stopping Tunnel Services...${NC}"

# Stop Cloudflare tunnel
stop_process "cloudflared tunnel" "Cloudflare tunnel"

echo -e "${CYAN}🤖 Stopping AI Services...${NC}"

# Stop Ollama service
stop_process "ollama serve" "Ollama LLM service"
stop_port $PORT_OLLAMA "Ollama service"

echo -e "${CYAN}🧹 Cleaning up processes...${NC}"

# Additional cleanup for any remaining Next.js processes
pkill -f "next" 2>/dev/null || true
sleep 1

# Clean up any remaining Node.js processes on our ports
for port in $PORT_WHATSAPP $PORT_WORKSPACE $PORT_DEVELOPMENT $PORT_OLLAMA; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${YELLOW}🧹 Force cleaning port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

echo -e "${CYAN}🔍 Checking for remaining processes...${NC}"

remaining_processes=0

# Check for remaining Next.js processes
if pgrep -f "next dev" > /dev/null; then
    echo -e "${RED}⚠️  Some Next.js processes still running${NC}"
    remaining_processes=1
fi

# Check for remaining tunnel processes
if pgrep -f "cloudflared tunnel" > /dev/null; then
    echo -e "${RED}⚠️  Cloudflare tunnel still running${NC}"
    remaining_processes=1
fi

# Check for remaining Ollama processes
if pgrep -f "ollama serve" > /dev/null; then
    echo -e "${RED}⚠️  Ollama still running${NC}"
    remaining_processes=1
fi

# Check ports
for port in $PORT_WHATSAPP $PORT_WORKSPACE $PORT_DEVELOPMENT $PORT_OLLAMA; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo -e "${RED}⚠️  Port $port still in use${NC}"
        remaining_processes=1
    fi
done

echo -e "${CYAN}📊 Final Status Check...${NC}"

if [ $remaining_processes -eq 0 ]; then
    echo -e "${GREEN}✅ All services stopped successfully${NC}"
    
    # Clean up log files (optional)
    echo -e "${YELLOW}🧹 Cleaning up log files...${NC}"
    rm -f whatsapp-service.log workspace-service.log development-service.log 2>/dev/null || true
    rm -f tunnel-unified.log ollama.log 2>/dev/null || true
    
    # Clean up environment files
    rm -f .env.whatsapp .env.workspace .env.development 2>/dev/null || true
    
    # Clean up process info
    rm -f unified-processes.txt 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
else
    echo -e "${YELLOW}⚠️  Some processes may still be running${NC}"
    echo -e "${YELLOW}💡 Manual cleanup commands:${NC}"
    echo "• Check processes: ps aux | grep -E \"(next|cloudflared|ollama)\""
    echo "• Check ports: lsof -i:$PORT_WHATSAPP -i:$PORT_WORKSPACE -i:$PORT_DEVELOPMENT -i:$PORT_OLLAMA"
    echo "• Force kill all: pkill -9 -f \"(next|cloudflared|ollama)\""
fi

echo ""
echo -e "${GREEN}🎯 SYSTEM SHUTDOWN COMPLETE${NC}"
echo "======================================="
echo -e "${BLUE}📋 Services Stopped:${NC}"
echo "• WhatsApp automation (port $PORT_WHATSAPP)"
echo "• Employee workspace (port $PORT_WORKSPACE)"  
echo "• Development environment (port $PORT_DEVELOPMENT)"
echo "• Cloudflare tunnel (both domains)"
echo "• Ollama LLM service (port $PORT_OLLAMA)"
echo ""
echo -e "${BLUE}🗄️ Databases:${NC}"
echo "• PostgreSQL databases remain running (ooak_future_production, ooak_future_development)"
echo "• Use 'pg_ctl stop' if you need to stop PostgreSQL completely"
echo ""
echo -e "${BLUE}🚀 To restart the system:${NC}"
echo "• Run: ./start-permanent-ooak.sh"
echo ""
echo -e "${GREEN}✅ Ready for next startup!${NC}" 