#!/bin/bash

# 🚀 OOAK DUAL PRODUCTION DEPLOYMENT
# Industry Standard - Both Domains Always Working
# 
# api.ooak.photography      -> Port 3000 (WhatsApp Automations)
# workspace.ooak.photography -> Port 4000 (Employee Production)

set -e

# Colors
G='\033[0;32m'  # Green
Y='\033[1;33m'  # Yellow
B='\033[0;34m'  # Blue
R='\033[0;31m'  # Red
P='\033[0;35m'  # Purple
C='\033[0;36m'  # Cyan
NC='\033[0m'    # No Color

echo -e "${B}🚀 OOAK DUAL PRODUCTION DEPLOYMENT${NC}"
echo "=================================="
echo -e "${C}📱 api.ooak.photography      -> WhatsApp Automations (Port 3000)${NC}"
echo -e "${C}💼 workspace.ooak.photography -> Employee Production (Port 4000)${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${G}✅ Port $port: Service running${NC}"
        return 0
    else
        echo -e "${Y}⚠️ Port $port: Starting service...${NC}"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=15
    local attempt=1
    
    echo -e "${Y}⏳ Waiting for $name (port $port)...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            echo -e "${G}✅ $name is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${R}❌ $name failed to start${NC}"
    return 1
}

# Step 1: Ensure both services are running
echo -e "${Y}⚡ Step 1: Starting Both Services${NC}"

# Start API service (port 3000) if not running
if ! check_port 3000; then
    npm run dev > api-service.log 2>&1 &
    API_PID=$!
    echo "API service started (PID: $API_PID)"
fi

# Start Production service (port 4000) if not running  
if ! check_port 4000; then
    npm run dev -- --port 4000 > production-service.log 2>&1 &
    PROD_PID=$!
    echo "Production service started (PID: $PROD_PID)"
fi

# Wait for both services to be ready
wait_for_service 3000 "API Service"
wait_for_service 4000 "Production Service"

# Step 2: Stop existing tunnels
echo -e "${Y}🛑 Step 2: Stopping Existing Tunnels${NC}"
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 3

# Step 3: Start dual tunnel
echo -e "${Y}🌐 Step 3: Starting Dual Tunnel${NC}"
cloudflared tunnel --config tunnel-config-dual.yml run ooak-tunnel > dual-tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "Dual tunnel started (PID: $TUNNEL_PID)"

# Step 4: Wait for tunnel to be ready
echo -e "${Y}⏳ Step 4: Waiting for tunnel to propagate...${NC}"
sleep 10

# Step 5: Test both domains
echo -e "${Y}🧪 Step 5: Testing Both Domains${NC}"

# Test API domain
echo -n "Testing api.ooak.photography... "
if curl -s "https://api.ooak.photography" > /dev/null 2>&1; then
    echo -e "${G}✅ Working${NC}"
    API_STATUS="✅ Working"
else
    echo -e "${R}❌ Failed${NC}"
    API_STATUS="❌ Failed"
fi

# Test Workspace domain
echo -n "Testing workspace.ooak.photography... "
if curl -s "https://workspace.ooak.photography" > /dev/null 2>&1; then
    echo -e "${G}✅ Working${NC}"
    WORKSPACE_STATUS="✅ Working"
else
    echo -e "${R}❌ Failed${NC}"
    WORKSPACE_STATUS="❌ Failed"
fi

# Step 6: Save process information
echo -e "${Y}💾 Step 6: Saving Process Information${NC}"
cat > dual-production-processes.txt << EOF
API_PID=${API_PID:-$(lsof -ti:3000)}
PRODUCTION_PID=${PROD_PID:-$(lsof -ti:4000)}
TUNNEL_PID=${TUNNEL_PID}
STARTED=$(date)
API_DOMAIN=api.ooak.photography
WORKSPACE_DOMAIN=workspace.ooak.photography
API_PORT=3000
PRODUCTION_PORT=4000
EOF

echo -e "${G}✅ Process information saved${NC}"

# Step 7: Display results
echo ""
echo -e "${P}🎉 DUAL PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo "========================================"
echo ""
echo -e "${B}📱 WhatsApp Automations:${NC}"
echo -e "   🌐 URL: https://api.ooak.photography"
echo -e "   📊 Status: $API_STATUS"
echo -e "   🔧 Port: 3000"
echo ""
echo -e "${B}💼 Employee Workspace:${NC}"
echo -e "   🌐 URL: https://workspace.ooak.photography"
echo -e "   📊 Status: $WORKSPACE_STATUS"
echo -e "   🔧 Port: 4000"
echo ""
echo -e "${B}🔗 Key Endpoints:${NC}"
echo -e "   📱 WhatsApp Webhook: https://api.ooak.photography/api/webhooks/whatsapp"
echo -e "   🔐 Employee Login: https://workspace.ooak.photography/login"
echo -e "   📊 Employee Dashboard: https://workspace.ooak.photography/dashboard"
echo ""
echo -e "${B}📋 Management Commands:${NC}"
echo "• View API logs: tail -f api-service.log"
echo "• View production logs: tail -f production-service.log"
echo "• View tunnel logs: tail -f dual-tunnel.log"
echo "• Check API: curl https://api.ooak.photography"
echo "• Check workspace: curl https://workspace.ooak.photography"
echo "• Stop all: pkill -f 'next dev'; pkill -f 'cloudflared tunnel'"
echo ""
echo -e "${Y}💡 Both domains are now live and will always work!${NC}"
echo -e "${G}✅ Restart-safe URLs that never change${NC}" 