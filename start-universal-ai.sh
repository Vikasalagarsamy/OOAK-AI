#!/bin/bash

# Universal AI System - Consistent Startup Script
# Ensures port 3000 is always used for Next.js and ngrok

echo "🚀 Starting Universal AI System on Port 3000..."

# Kill any processes on port 3000
echo "🔧 Freeing up port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "✅ Port 3000 is free"

# Stop any existing Next.js or ngrok processes
echo "🛑 Stopping existing processes..."
pkill -f "next dev" 2>/dev/null || echo "✅ Next.js processes stopped"
pkill -f "ngrok" 2>/dev/null || echo "✅ ngrok processes stopped"

# Wait a moment for processes to stop
sleep 2

# Start Next.js on port 3000
echo "⚡ Starting Next.js on port 3000..."
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Next.js to initialize..."
sleep 5

# Start ngrok on port 3000
echo "🌐 Starting ngrok tunnel on port 3000..."
ngrok http 3000 --log=stdout &
NGROK_PID=$!

# Wait for ngrok to establish tunnel
echo "⏳ Waiting for ngrok tunnel to establish..."
sleep 3

# Get the public URL
echo "🔍 Getting public URL..."
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.proto=="https") | .public_url' 2>/dev/null)

if [ ! -z "$PUBLIC_URL" ]; then
    echo ""
    echo "✅ Universal AI System is LIVE!"
    echo "================================"
    echo "🌐 Local URL: http://localhost:3000"
    echo "🌍 Public URL: $PUBLIC_URL"
    echo ""
    echo "📱 WhatsApp Webhook: $PUBLIC_URL/api/webhooks/whatsapp"
    echo "📸 Instagram Webhook: $PUBLIC_URL/api/webhooks/instagram"
    echo "📧 Email Webhook: $PUBLIC_URL/api/webhooks/email"
    echo "📞 Calls Webhook: $PUBLIC_URL/api/webhooks/calls"
    echo ""
    echo "🧪 Test AI: http://localhost:3000/test-ai"
    echo "📊 Dashboard: http://localhost:3000/dashboard"
    echo "📈 Sales: http://localhost:3000/sales"
    echo ""
    echo "🔧 Ngrok Dashboard: http://localhost:4040"
    echo ""
    
    # Update environment file with new public URL ONLY
    echo "📝 Updating .env.local with public URL..."
    sed -i.bak "s|PUBLIC_URL=.*|PUBLIC_URL=$PUBLIC_URL|g" .env.local
    # DO NOT touch other URLs - they are managed by master-config.js
    
    echo "✅ Environment updated!"
    echo ""
    echo "🎯 Your webhook URLs are ready for Meta Developer Console!"
    echo "📋 Copy these URLs to your WhatsApp/Instagram webhook settings:"
    echo "   WhatsApp: $PUBLIC_URL/api/webhooks/whatsapp"
    echo "   Instagram: $PUBLIC_URL/api/webhooks/instagram"
    echo ""
    echo "🔑 Use these verify tokens:"
    echo "   WhatsApp: whatsapp_verify_123"
    echo "   Instagram: instagram_verify_456"
    
else
    echo "❌ Failed to get ngrok public URL. Please check ngrok status at http://localhost:4040"
fi

echo ""
echo "💡 To stop all services, run: ./stop-universal-ai.sh"
echo "🔄 To restart, run: ./start-universal-ai.sh"
echo ""

# Save process IDs for cleanup
echo $NEXTJS_PID > .nextjs.pid
echo $NGROK_PID > .ngrok.pid

echo "🎉 Universal AI System is ready! Press Ctrl+C to stop."

# Keep script running
wait 