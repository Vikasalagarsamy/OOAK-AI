#!/bin/bash

# Universal AI System - Stop Script
# Cleanly stops all services

echo "🛑 Stopping Universal AI System..."

# Stop processes by PID if available
if [ -f .nextjs.pid ]; then
    NEXTJS_PID=$(cat .nextjs.pid)
    echo "🔧 Stopping Next.js (PID: $NEXTJS_PID)..."
    kill $NEXTJS_PID 2>/dev/null || echo "Next.js already stopped"
    rm .nextjs.pid
fi

if [ -f .ngrok.pid ]; then
    NGROK_PID=$(cat .ngrok.pid)
    echo "🔧 Stopping ngrok (PID: $NGROK_PID)..."
    kill $NGROK_PID 2>/dev/null || echo "ngrok already stopped"
    rm .ngrok.pid
fi

# Kill any remaining processes
echo "🧹 Cleaning up remaining processes..."
pkill -f "next dev" 2>/dev/null || echo "✅ Next.js processes cleaned"
pkill -f "ngrok" 2>/dev/null || echo "✅ ngrok processes cleaned"

# Free up port 3000
echo "🔓 Freeing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "✅ Port 3000 is free"

echo ""
echo "✅ Universal AI System stopped successfully!"
echo "🔄 To start again, run: ./start-universal-ai.sh"
echo "" 