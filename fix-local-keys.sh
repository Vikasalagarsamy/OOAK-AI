#!/bin/bash

# 🔧 Fix Local Supabase API Keys
# ==============================

echo "🔧 Fixing API keys in .env.local..."

# Fix the API keys by removing any extra spaces
sed -i '' 's/ey AgCiAgICAi/eyAgCiAgICAi/g' .env.local

echo "✅ Fixed API keys in .env.local"
echo ""
echo "🧪 Testing connection..."

# Test the connection
node test-local-connection.cjs 