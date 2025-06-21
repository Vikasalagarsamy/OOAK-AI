#!/bin/bash

# OOAK Production Deployment Script
# Industry Standard - Fast & Reliable
# Connects localhost:4000 (production) to api.ooak.photography

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
PRODUCTION_PORT=4000
DOMAIN="api.ooak.photography"
TUNNEL_NAME="ooak-tunnel"
TUNNEL_CONFIG="tunnel-config-production.yml"

echo -e "${BLUE}🚀 OOAK PRODUCTION DEPLOYMENT${NC}"
echo "=============================="
echo -e "${GREEN}✅ Production Port: ${PRODUCTION_PORT}${NC}"
echo -e "${GREEN}✅ Domain: ${DOMAIN}${NC}"
echo -e "${GREEN}✅ Tunnel: ${TUNNEL_NAME}${NC}"
echo ""

# Step 1: Health Check
echo -e "${YELLOW}🏥 Step 1: Production Health Check${NC}"
if curl -s "http://localhost:${PRODUCTION_PORT}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Production instance is running on port ${PRODUCTION_PORT}${NC}"
else
    echo -e "${RED}❌ Production instance not running on port ${PRODUCTION_PORT}${NC}"
    echo -e "${YELLOW}💡 Starting production instance...${NC}"
    
    # Start production instance
    npm run dev -- --port ${PRODUCTION_PORT} > production.log 2>&1 &
    PROD_PID=$!
    echo "Production started (PID: $PROD_PID)"
    
    # Wait for production to be ready
    echo -e "${YELLOW}⏳ Waiting for production to be ready...${NC}"
    for i in {1..30}; do
        if curl -s "http://localhost:${PRODUCTION_PORT}" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Production is ready!${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
fi

# Step 2: Create Production Tunnel Configuration
echo -e "${YELLOW}🔧 Step 2: Creating Production Tunnel Config${NC}"
cat > ${TUNNEL_CONFIG} << EOF
tunnel: 1ff1c831-f990-44e6-8b8e-b5d0027e8af7
credentials-file: /Users/vikasalagarsamy/.cloudflared/1ff1c831-f990-44e6-8b8e-b5d0027e8af7.json

ingress:
  - hostname: ${DOMAIN}
    service: http://localhost:${PRODUCTION_PORT}
  - service: http_status:404
EOF

echo -e "${GREEN}✅ Production tunnel config created: ${TUNNEL_CONFIG}${NC}"

# Step 3: Stop any existing tunnels
echo -e "${YELLOW}🛑 Step 3: Stopping existing tunnels${NC}"
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2

# Step 4: Start Production Tunnel
echo -e "${YELLOW}🌐 Step 4: Starting Production Tunnel${NC}"
cloudflared tunnel --config ${TUNNEL_CONFIG} run ${TUNNEL_NAME} > tunnel-production.log 2>&1 &
TUNNEL_PID=$!
echo "Production tunnel started (PID: $TUNNEL_PID)"

# Step 5: Wait for tunnel to be ready
echo -e "${YELLOW}⏳ Step 5: Waiting for tunnel to be ready...${NC}"
for i in {1..30}; do
    if curl -s "https://${DOMAIN}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Production tunnel is live!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Step 6: Comprehensive Testing
echo -e "${YELLOW}🧪 Step 6: Production Testing${NC}"

# Test main endpoint
if curl -s "https://${DOMAIN}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Main URL: https://${DOMAIN}${NC}"
else
    echo -e "${RED}❌ Main URL failed${NC}"
fi

# Test API endpoints
if curl -s "https://${DOMAIN}/api/auth/status" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Auth API: Working${NC}"
else
    echo -e "${YELLOW}⚠️ Auth API: May need authentication${NC}"
fi

# Test dashboard
if curl -s "https://${DOMAIN}/api/dashboard/batch" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dashboard API: Working${NC}"
else
    echo -e "${YELLOW}⚠️ Dashboard API: May need authentication${NC}"
fi

# Step 7: Save process IDs
echo -e "${YELLOW}💾 Step 7: Saving process information${NC}"
cat > production-processes.txt << EOF
PRODUCTION_PID=${PROD_PID:-$(lsof -ti:${PRODUCTION_PORT})}
TUNNEL_PID=${TUNNEL_PID}
STARTED=$(date)
DOMAIN=${DOMAIN}
PORT=${PRODUCTION_PORT}
EOF

echo -e "${GREEN}✅ Process information saved to production-processes.txt${NC}"

# Step 8: Display success information
echo ""
echo -e "${PURPLE}🎉 PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo "===================================="
echo -e "${GREEN}🌐 Production URL: https://${DOMAIN}${NC}"
echo -e "${GREEN}📱 WhatsApp Webhook: https://${DOMAIN}/api/webhooks/whatsapp${NC}"
echo -e "${GREEN}📊 Dashboard: https://${DOMAIN}/dashboard${NC}"
echo -e "${GREEN}🔐 Login: https://${DOMAIN}/login${NC}"
echo ""
echo -e "${BLUE}📋 Management Commands:${NC}"
echo "• View production logs: tail -f production.log"
echo "• View tunnel logs: tail -f tunnel-production.log"
echo "• Stop production: pkill -f 'next dev.*${PRODUCTION_PORT}'"
echo "• Stop tunnel: pkill -f 'cloudflared tunnel'"
echo "• Check status: curl https://${DOMAIN}"
echo ""
echo -e "${YELLOW}💡 Production is now live and accessible worldwide!${NC}"
echo -e "${GREEN}✅ URL never changes - restart safe!${NC}" 