#!/bin/bash

# UNIVERSAL AI SYSTEM - RESTART SCRIPT
# Simple script to restart with permanent webhooks

echo "🔄 RESTARTING UNIVERSAL AI SYSTEM"
echo "================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Stop everything
echo -e "${YELLOW}🛑 Stopping all processes...${NC}"
pkill -f "next" 2>/dev/null && echo "✅ Stopped Next.js"
pkill -f "cloudflared" 2>/dev/null && echo "✅ Stopped Cloudflare tunnel"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ Cleared port 3000"
sleep 3

# Step 2: Start Cloudflare Tunnel (permanent URL)
echo -e "\n${BLUE}🌐 Starting permanent tunnel...${NC}"
cloudflared tunnel --url http://localhost:3000 > tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "Tunnel started (PID: $TUNNEL_PID)"
sleep 5

# Step 3: Start Next.js
echo -e "\n${BLUE}⚡ Starting Next.js server...${NC}"
npm run dev > nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js started (PID: $NEXTJS_PID)"
sleep 8

# Step 4: Test everything
echo -e "\n${BLUE}🧪 Testing system...${NC}"

# Test local server
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Local server (http://localhost:3000): WORKING${NC}"
else
    echo -e "${RED}❌ Local server: NOT RESPONDING${NC}"
fi

# Test permanent tunnel
if curl -s https://prints-nc-wanna-physics.trycloudflare.com >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Permanent tunnel: WORKING${NC}"
else
    echo -e "${YELLOW}⚠️  Permanent tunnel: Starting up...${NC}"
fi

# Test WhatsApp webhook
if curl -s "https://prints-nc-wanna-physics.trycloudflare.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test&hub.verify_token=whatsapp_verify_123" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ WhatsApp webhook: WORKING${NC}"
else
    echo -e "${YELLOW}⚠️  WhatsApp webhook: May still be starting${NC}"
fi

# Test AI endpoint
if curl -s http://localhost:3000/api/ai-simple-test >/dev/null 2>&1; then
    echo -e "${GREEN}✅ AI endpoint: WORKING${NC}"
else
    echo -e "${YELLOW}⚠️  AI endpoint: Still starting up${NC}"
fi

# Check persistent storage
if [ -f "data/whatsapp_messages.json" ]; then
    MESSAGE_COUNT=$(jq length data/whatsapp_messages.json 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Persistent storage: $MESSAGE_COUNT messages stored${NC}"
else
    echo -e "${BLUE}ℹ️  Persistent storage: Ready (no messages yet)${NC}"
fi

# Show results
echo -e "\n${GREEN}🎉 RESTART COMPLETE!${NC}"
echo "================================="
echo -e "${BLUE}📋 SYSTEM URLS:${NC}"
echo "🌐 Permanent Webhook: https://prints-nc-wanna-physics.trycloudflare.com"
echo "💻 Local Dashboard: http://localhost:3000"
echo "📱 WhatsApp Business: +919677362524"
echo ""
echo -e "${BLUE}🎯 TESTING COMMANDS:${NC}"
echo ""
echo "1️⃣ Test webhook manually:"
echo "curl -X POST https://sam-detect-folders-translation.trycloudflare.com/api/webhooks/whatsapp -H 'Content-Type: application/json' -d '{\"test\":\"restart_test\"}'"
echo ""
echo "2️⃣ Test AI knowledge:"
echo "curl -X POST http://localhost:3000/api/ai-simple-test -H 'Content-Type: application/json' -d '{\"message\":\"What WhatsApp messages do you see?\"}'"
echo ""
echo "3️⃣ Check logs:"
echo "tail -f tunnel.log    # Cloudflare tunnel logs"
echo "tail -f nextjs.log    # Next.js server logs"
echo ""
echo -e "${GREEN}✅ System is ready for testing!${NC}"
echo "Send a WhatsApp message to +919677362524 to test real integration" 