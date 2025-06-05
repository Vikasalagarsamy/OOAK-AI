#!/bin/bash
# Quick test runner for AI notification system

echo '🧪 AI Notification System - Quick Test Runner'
echo '============================================='

# Check if Next.js is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo '❌ Next.js is not running. Please start with: npm run dev'
    exit 1
fi

echo '✅ Next.js is running'

# Test basic endpoint
echo '📡 Testing basic API endpoint...'
curl -s http://localhost:3000/api/notifications > /dev/null && echo '✅ API endpoints accessible' || echo '❌ API endpoints not accessible'

echo ''
echo '🚀 Test Options:'
echo '1. Open browser test page: http://localhost:3000/test-ai-notifications.html'
echo '2. Run Node.js tests: node scripts/test-ai-notifications.js'
echo '3. Manual testing: See docs/TESTING_GUIDE.md'
echo ''
echo '📝 Don'\''t forget to:'
echo '   • Set your auth token in the test configuration'
echo '   • Ensure you have a test user in Supabase'
echo '   • Verify AI database tables are created' 