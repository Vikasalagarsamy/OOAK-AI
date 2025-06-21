#!/bin/bash

# QUICK SYSTEM TEST SCRIPT
# Tests all components of the Universal AI system

echo "🧪 TESTING UNIVERSAL AI SYSTEM"
echo "==============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Running comprehensive tests...${NC}\n"

# Test 1: Local Next.js server
echo -n "1️⃣ Local server (localhost:3000): "
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ WORKING${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test 2: Permanent Cloudflare tunnel
echo -n "2️⃣ Permanent tunnel: "
if curl -s https://sam-detect-folders-translation.trycloudflare.com >/dev/null 2>&1; then
    echo -e "${GREEN}✅ WORKING${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test 3: WhatsApp webhook endpoint
echo -n "3️⃣ WhatsApp webhook: "
WEBHOOK_RESPONSE=$(curl -s "https://sam-detect-folders-translation.trycloudflare.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=whatsapp_verify_123")
if [ "$WEBHOOK_RESPONSE" = "test123" ]; then
    echo -e "${GREEN}✅ WORKING${NC}"
else
    echo -e "${RED}❌ FAILED (Response: $WEBHOOK_RESPONSE)${NC}"
fi

# Test 4: AI endpoint
echo -n "4️⃣ AI endpoint: "
if curl -s http://localhost:3000/api/ai-simple-test >/dev/null 2>&1; then
    echo -e "${GREEN}✅ WORKING${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test 5: Ollama AI connection
echo -n "5️⃣ Ollama AI (127.0.0.1:11434): "
if curl -s http://127.0.0.1:11434 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ WORKING${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test 6: Persistent storage
echo -n "6️⃣ Persistent storage: "
if [ -f "data/whatsapp_messages.json" ]; then
    MESSAGE_COUNT=$(jq length data/whatsapp_messages.json 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ ACTIVE ($MESSAGE_COUNT messages)${NC}"
else
    echo -e "${YELLOW}⚠️  READY (no messages yet)${NC}"
fi

# Test 7: Process check
echo -n "7️⃣ Running processes: "
NEXT_RUNNING=$(ps aux | grep -v grep | grep "next" | wc -l)
TUNNEL_RUNNING=$(ps aux | grep -v grep | grep "cloudflared" | wc -l)
if [ "$NEXT_RUNNING" -gt 0 ] && [ "$TUNNEL_RUNNING" -gt 0 ]; then
    echo -e "${GREEN}✅ WORKING (Next.js: $NEXT_RUNNING, Tunnel: $TUNNEL_RUNNING)${NC}"
else
    echo -e "${RED}❌ FAILED (Next.js: $NEXT_RUNNING, Tunnel: $TUNNEL_RUNNING)${NC}"
fi

echo -e "\n${BLUE}🎯 INTEGRATION TESTS:${NC}\n"

# Integration Test 1: Send test webhook
echo "8️⃣ Testing webhook integration..."
WEBHOOK_TEST=$(curl -s -X POST https://sam-detect-folders-translation.trycloudflare.com/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"919677362524","phone_number_id":"test"},"messages":[{"id":"test_integration","from":"919677362524","timestamp":"1735890999","text":{"body":"Integration test message"},"type":"text"}]},"field":"messages"}]}]}')

if echo "$WEBHOOK_TEST" | grep -q "success"; then
    echo -e "   ${GREEN}✅ Webhook integration: WORKING${NC}"
else
    echo -e "   ${RED}❌ Webhook integration: FAILED${NC}"
fi

# Integration Test 2: Test AI reading
echo "9️⃣ Testing AI reading integration..."
AI_TEST=$(curl -s -X POST http://localhost:3000/api/ai-simple-test \
  -H "Content-Type: application/json" \
  -d '{"message":"Quick test - what messages do you see?"}')

if echo "$AI_TEST" | grep -q "success"; then
    MESSAGE_COUNT=$(echo "$AI_TEST" | jq -r '.whatsapp_messages_count // 0' 2>/dev/null || echo "0")
    echo -e "   ${GREEN}✅ AI integration: WORKING ($MESSAGE_COUNT messages accessible)${NC}"
else
    echo -e "   ${RED}❌ AI integration: FAILED${NC}"
fi

echo -e "\n${GREEN}🎉 TEST COMPLETE!${NC}"
echo "==============================="
echo -e "${BLUE}📋 SUMMARY:${NC}"
echo "🌐 Permanent URL: https://sam-detect-folders-translation.trycloudflare.com"
echo "💻 Local URL: http://localhost:3000"
echo "📱 WhatsApp: +919677362524"
echo ""
echo -e "${BLUE}🚀 READY FOR PRODUCTION TESTING!${NC}" 