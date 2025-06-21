#!/bin/bash

echo "🚀 Starting OOAK Call Manager Pro..."
echo "📍 Current directory: $(pwd)"

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f expo 2>/dev/null || true
lsof -ti:8081,19000,19001,19002 | xargs kill -9 2>/dev/null || true

# Clear cache
echo "🧹 Clearing cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Start Expo with tunnel
echo "🌐 Starting Expo with tunnel mode..."
echo "This will create a public URL that works from anywhere!"

# Try multiple methods
if [ -f "./node_modules/.bin/expo" ]; then
    echo "Method 1: Using ./node_modules/.bin/expo"
    ./node_modules/.bin/expo start --tunnel --clear
elif [ -f "node_modules/expo/bin/cli" ]; then
    echo "Method 2: Using node directly"
    node node_modules/expo/bin/cli start --tunnel --clear
else
    echo "Method 3: Using npx"
    /usr/local/bin/npx expo start --tunnel --clear
fi 