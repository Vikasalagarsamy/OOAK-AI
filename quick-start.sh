#!/bin/bash
cd "$(dirname "$0")"
echo "Starting OOAK Call Manager Pro..."
echo "Current directory: $(pwd)"

# Method 1: Direct node execution
if [ -f "node_modules/expo/bin/cli" ]; then
    echo "Using direct node execution..."
    node node_modules/expo/bin/cli start --tunnel --clear
else
    echo "Expo not found. Installing..."
    npm install
    node node_modules/expo/bin/cli start --tunnel --clear
fi

# 🚀 INSTANT AI BUSINESS STARTUP
# ==============================
# For busy business owners - Just run this and GO!

echo "🤖 STARTING YOUR AI BUSINESS IN 30 SECONDS..."
echo "☕ Grab coffee while this runs automatically!"
echo ""

# Run the full business startup
./start-permanent-ooak.sh

echo ""
echo "🎉 YOUR AI BUSINESS IS LIVE!"
echo "================================"
echo "🏠 Your Website: http://localhost:3000"
echo "🌍 Public API: https://api.ooak.photography"
echo "📱 WhatsApp: https://api.ooak.photography/api/webhooks/whatsapp"
echo "📊 Call Analytics: https://api.ooak.photography/tasks/dashboard/call-analytics"
echo ""
echo "💡 Need more control? Run: ./business-control.sh"
echo "🆘 Emergency stop: Press Ctrl+C then run: pkill -f 'next dev'" 