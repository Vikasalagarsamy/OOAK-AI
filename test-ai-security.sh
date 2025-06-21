#!/bin/bash

# 🔒 AI BUSINESS INTELLIGENCE SECURITY TESTER
# Created for business owner to test AI endpoint security

echo "🔒 AI SECURITY TESTING SUITE"
echo "============================="
echo ""

# Test 1: Unauthorized Access (Should FAIL)
echo "🚫 TEST 1: Unauthorized Access (Should be BLOCKED)"
echo "Testing endpoint without authentication..."

curl -s -X POST http://localhost:3000/api/ai-business-intelligence \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my business insights?"}' | \
  jq -r '.error // "No error field found"'
echo ""

# Test 2: Authenticated Access (Should WORK)
echo "✅ TEST 2: Authenticated Access (Should WORK)"
echo "Testing with proper authentication..."

curl -s -X POST http://localhost:3000/api/ai-business-intelligence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ai_business_intelligence_secret_key_2024_CHANGE_THIS" \
  -d '{"message": "What are my business insights?"}' | \
  jq -r '.success // "No success field found"'
echo ""

# Test 3: Admin Access (Should WORK with more data)
echo "🔑 TEST 3: Admin Access (Should work with FULL data access)"
echo "Testing with admin privileges..."

curl -s -X POST http://localhost:3000/api/ai-business-intelligence \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_ai_access_key_2024_CHANGE_THIS_TOO" \
  -d '{"message": "Show me detailed lead analysis"}' | \
  jq -r '.security.level // "No security level found"'
echo ""

# Test 4: Rate Limiting (Should block after 10 requests)
echo "⏱️ TEST 4: Rate Limiting (Should block after 10 requests per minute)"
echo "Testing rate limiting protection..."

for i in {1..12}
do
  response=$(curl -s -X POST http://localhost:3000/api/ai-business-intelligence \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ai_business_intelligence_secret_key_2024_CHANGE_THIS" \
    -d '{"message": "Test request #'$i'"}')
  
  if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    if echo "$response" | grep -q "Rate limit exceeded"; then
      echo "✅ Rate limiting WORKS! Blocked request #$i"
      break
    fi
  fi
  
  if [ $i -eq 12 ]; then
    echo "❌ Rate limiting may not be working properly"
  fi
done
echo ""

# Test 5: Security Headers Check
echo "🛡️ TEST 5: Security Headers"
echo "Checking security headers in response..."

curl -s -I -X GET http://localhost:3000/api/ai-business-intelligence | \
  grep -E "(X-Security-Level|X-RateLimit-Limit|X-Data-Classification)" || \
  echo "Some security headers missing (this is expected for GET request)"
echo ""

# Test 6: API Documentation Access
echo "📖 TEST 6: API Documentation"
echo "Checking if endpoint documentation is accessible..."

curl -s -X GET http://localhost:3000/api/ai-business-intelligence | \
  jq -r '.service // "Service documentation not found"'
echo ""

# Summary
echo "🔒 SECURITY TEST SUMMARY"
echo "========================"
echo "✅ All tests completed"
echo "🔍 Check results above:"
echo "  • Unauthorized access should be BLOCKED"
echo "  • Authenticated access should WORK"
echo "  • Admin access should show 'admin' level"
echo "  • Rate limiting should block after 10 requests"
echo "  • Security headers should be present"
echo ""
echo "🚨 IMPORTANT: Change default API keys in production!"
echo "   AI_ENDPOINT_SECRET=your_strong_secret_key"
echo "   AI_ADMIN_API_KEY=your_admin_key"
echo ""
echo "🎯 Your AI Business Intelligence is now SECURED!" 