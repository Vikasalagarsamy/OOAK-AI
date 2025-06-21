#!/bin/bash

# 🔄 QUICK RESTART - BOTH DOMAINS
# Ensures api.ooak.photography and workspace.ooak.photography always work

echo "🔄 RESTARTING BOTH DOMAINS"
echo "=========================="

# Stop everything
echo "🛑 Stopping services..."
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2

# Restart tunnel with correct config
echo "🌐 Starting dual tunnel..."
cloudflared tunnel --config tunnel-config-dual.yml run ooak-tunnel > tunnel-restart.log 2>&1 &

sleep 8

# Test both
echo "🧪 Testing domains..."
echo -n "api.ooak.photography: "
if curl -s https://api.ooak.photography > /dev/null 2>&1; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

echo -n "workspace.ooak.photography: "
if curl -s https://workspace.ooak.photography > /dev/null 2>&1; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

echo ""
echo "✅ Both domains restarted!"
echo "📱 WhatsApp: https://api.ooak.photography"
echo "💼 Employees: https://workspace.ooak.photography" 