#!/bin/bash

# 🚀 OOAK FAST PRODUCTION DEPLOYMENT
# Industry Standard - 3 Steps, 30 Seconds
# Connects your production (port 4000) to api.ooak.photography

set -e

# Colors
G='\033[0;32m'  # Green
Y='\033[1;33m'  # Yellow
B='\033[0;34m'  # Blue
R='\033[0;31m'  # Red
P='\033[0;35m'  # Purple
NC='\033[0m'    # No Color

echo -e "${B}🚀 FAST PRODUCTION DEPLOYMENT${NC}"
echo "============================="

# Step 1: Start Production (if not running)
echo -e "${Y}⚡ Step 1: Production Instance${NC}"
if ! curl -s http://localhost:4000 > /dev/null 2>&1; then
    echo "Starting production on port 4000..."
    npm run dev -- --port 4000 > production.log 2>&1 &
    sleep 8
fi
echo -e "${G}✅ Production ready on port 4000${NC}"

# Step 2: Create tunnel config for production
echo -e "${Y}🔧 Step 2: Tunnel Configuration${NC}"
cat > tunnel-prod.yml << 'EOF'
tunnel: 1ff1c831-f990-44e6-8b8e-b5d0027e8af7
credentials-file: /Users/vikasalagarsamy/.cloudflared/1ff1c831-f990-44e6-8b8e-b5d0027e8af7.json

ingress:
  - hostname: api.ooak.photography
    service: http://localhost:4000
  - service: http_status:404
EOF
echo -e "${G}✅ Tunnel config created${NC}"

# Step 3: Start tunnel
echo -e "${Y}🌐 Step 3: Connect to Domain${NC}"
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2
cloudflared tunnel --config tunnel-prod.yml run ooak-tunnel > tunnel.log 2>&1 &
sleep 8

# Test
echo -e "${Y}🧪 Testing...${NC}"
if curl -s https://api.ooak.photography > /dev/null 2>&1; then
    echo -e "${G}✅ SUCCESS! Production is LIVE${NC}"
else
    echo -e "${R}❌ Connection failed - checking logs...${NC}"
    tail -5 tunnel.log
    exit 1
fi

echo ""
echo -e "${P}🎉 PRODUCTION DEPLOYED!${NC}"
echo "======================"
echo -e "${G}🌐 URL: https://api.ooak.photography${NC}"
echo -e "${G}📱 WhatsApp: https://api.ooak.photography/api/webhooks/whatsapp${NC}"
echo -e "${G}🔐 Login: https://api.ooak.photography/login${NC}"
echo ""
echo -e "${B}📊 Quick Commands:${NC}"
echo "• Check status: curl https://api.ooak.photography"
echo "• View logs: tail -f tunnel.log"
echo "• Stop: pkill -f 'cloudflared tunnel'"
echo ""
echo -e "${Y}⚡ DEPLOYMENT COMPLETE IN 30 SECONDS!${NC}" 