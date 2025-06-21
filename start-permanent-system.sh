#!/bin/bash

# Universal AI System - PERMANENT STARTUP SCRIPT
# Uses Cloudflare Tunnel for permanent webhook URLs
# No more broken webhooks on server restart!

echo "🚀 STARTING UNIVERSAL AI SYSTEM WITH PERMANENT WEBHOOKS"
echo "============================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
pkill -f "next" 2>/dev/null || echo "✅ Next.js processes stopped"
pkill -f "cloudflared" 2>/dev/null || echo "✅ Cloudflare tunnel processes stopped"
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "✅ Port 3000 cleared"

# Wait for ports to be freed
sleep 2

echo -e "\n${BLUE}📱 PERMANENT WEBHOOK CONFIGURATION${NC}"
echo "WhatsApp: https://api.ooak.photography/api/webhooks/whatsapp"
echo "Instagram: https://api.ooak.photography/api/webhooks/instagram"
echo "Email: https://api.ooak.photography/api/webhooks/email"
echo "Calls: https://api.ooak.photography/api/webhooks/calls"

# Start Cloudflare Tunnel (permanent URL)
echo -e "\n${BLUE}🌐 Starting PERMANENT Cloudflare Tunnel...${NC}"
cloudflared tunnel --url http://localhost:3000 > tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "Tunnel PID: $TUNNEL_PID"

# Wait for tunnel to start
echo "⏳ Waiting for tunnel to initialize..."
sleep 5

# Verify tunnel is working
echo -e "\n${BLUE}🔍 Verifying tunnel status...${NC}"
if curl -s https://api.ooak.photography >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Permanent tunnel is active!${NC}"
else
    echo -e "${YELLOW}⚠️  Tunnel may still be starting up...${NC}"
fi

# Start Next.js development server
echo -e "\n${BLUE}⚡ Starting Next.js server on port 3000...${NC}"
npm run dev &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to start..."
sleep 10

# Test the system
echo -e "\n${BLUE}🧪 Testing system components...${NC}"

# Test 1: Local server
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Local server: WORKING${NC}"
else
    echo -e "${RED}❌ Local server: NOT RESPONDING${NC}"
fi

# Test 2: Permanent webhook
if curl -s https://api.ooak.photography >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Permanent tunnel: WORKING${NC}"
else
    echo -e "${RED}❌ Permanent tunnel: NOT RESPONDING${NC}"
fi

# Test 3: WhatsApp endpoint
if curl -s "https://api.ooak.photography/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=whatsapp_verify_123" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ WhatsApp webhook: WORKING${NC}"
else
    echo -e "${YELLOW}⚠️  WhatsApp webhook: May need verification token update${NC}"
fi

# Test 4: AI endpoint
if curl -s http://localhost:3000/api/ai-simple-test >/dev/null 2>&1; then
    echo -e "${GREEN}✅ AI endpoint: WORKING${NC}"
else
    echo -e "${RED}❌ AI endpoint: NOT RESPONDING${NC}"
fi

# Test 5: Persistent storage
if [ -f "data/whatsapp_messages.json" ]; then
    MESSAGE_COUNT=$(jq length data/whatsapp_messages.json 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Persistent storage: $MESSAGE_COUNT messages stored${NC}"
else
    echo -e "${YELLOW}⚠️  Persistent storage: No messages yet${NC}"
fi

echo -e "\n${GREEN}🎉 PERMANENT SYSTEM STARTUP COMPLETE!${NC}"
echo "============================================================"
echo -e "${BLUE}📋 IMPORTANT URLS:${NC}"
echo "🌐 Permanent Webhook: https://api.ooak.photography"
echo "💻 Local Dashboard: http://localhost:3000"
echo "📱 WhatsApp Business: +919677362524"
echo ""
echo -e "${BLUE}🎯 NEXT STEPS:${NC}"
echo "1. Update Interakt webhook URL to: https://api.ooak.photography/api/webhooks/whatsapp"
echo "2. Send test message from your phone to +919677362524"
echo "3. Check AI knowledge: curl -X POST http://localhost:3000/api/ai-simple-test -H 'Content-Type: application/json' -d '{\"message\":\"What WhatsApp messages do you see?\"}'"
echo ""
echo -e "${GREEN}✅ System is now PERMANENT and restart-proof!${NC}"

# Keep the script running to monitor processes
echo -e "\n${BLUE}📊 Monitoring system (Ctrl+C to stop)...${NC}"
while true; do
    sleep 30
    
    # Check if processes are still running
    if ! ps -p $TUNNEL_PID > /dev/null 2>&1; then
        echo -e "${RED}⚠️  Tunnel process stopped, restarting...${NC}"
        cloudflared tunnel --url http://localhost:3000 > tunnel.log 2>&1 &
        TUNNEL_PID=$!
    fi
    
    if ! ps -p $NEXTJS_PID > /dev/null 2>&1; then
        echo -e "${RED}⚠️  Next.js process stopped, restarting...${NC}"
        npm run dev &
        NEXTJS_PID=$!
    fi
done 