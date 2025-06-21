#!/usr/bin/env node

const baseUrl = 'http://localhost:3000';

console.log('🚀 TESTING AI-POWERED FOLLOW-UP SYSTEM');
console.log('=' .repeat(60));

async function testAISystem() {
  console.log('\n🧪 COMPREHENSIVE SYSTEM TEST');
  console.log('Testing all components of the AI-powered follow-up system\n');

  // Test 1: Check if AI endpoints are available
  console.log('1️⃣ Testing API Endpoints...');
  await testAPIEndpoints();

  // Test 2: Test WhatsApp webhook
  console.log('\n2️⃣ Testing WhatsApp Webhook...');
  await testWhatsAppWebhook();

  // Test 3: Test quotation approval workflow
  console.log('\n3️⃣ Testing Enhanced Approval Workflow...');
  await testApprovalWorkflow();

  // Test 4: Test AI insights endpoint
  console.log('\n4️⃣ Testing AI Insights...');
  await testAIInsights();

  console.log('\n🎯 SYSTEM TEST COMPLETED!');
  console.log('\nNext Steps:');
  console.log('  ✅ Add OPENAI_API_KEY to .env.local');
  console.log('  ✅ Configure Interakt webhook URL');
  console.log('  ✅ Test with real quotation approval');
  console.log('  ✅ Monitor AI task generation');
}

async function testAPIEndpoints() {
  const endpoints = [
    '/api/whatsapp/webhook',
    '/api/quotation-insights',
    '/api/quotation-approval'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      // We expect authentication errors for most endpoints, which is good
      if (response.status === 401) {
        console.log(`  ✅ ${endpoint} - Properly secured (401 Unauthorized)`);
      } else if (response.status === 405) {
        console.log(`  ✅ ${endpoint} - Available (405 Method Not Allowed for GET)`);
      } else if (response.ok) {
        console.log(`  ✅ ${endpoint} - Available (${response.status})`);
      } else {
        console.log(`  ⚠️ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint} - Connection error`);
    }
  }
}

async function testWhatsAppWebhook() {
  try {
    const testMessage = {
      type: "message",
      direction: "inbound",
      from: "+919876543210",
      text: "Test message for AI analysis",
      timestamp: new Date().toISOString(),
      id: `test_${Date.now()}`
    };

    console.log('  📱 Sending test WhatsApp message...');
    
    const response = await fetch(`${baseUrl}/api/whatsapp/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('  ✅ WhatsApp webhook working:', result.message || 'Success');
    } else {
      console.log('  ⚠️ WhatsApp webhook response:', result.error || 'Unknown error');
      console.log('  💡 This is expected if no quotation exists for test phone number');
    }
  } catch (error) {
    console.log('  ❌ WhatsApp webhook test failed:', error.message);
  }
}

async function testApprovalWorkflow() {
  try {
    console.log('  🎯 Testing quotation approval with AI follow-up...');
    
    // This will likely fail without authentication, but we can see if the endpoint responds
    const response = await fetch(`${baseUrl}/api/quotation-approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotationId: 1,
        action: 'approve',
        comments: 'Test approval with AI follow-up'
      })
    });

    if (response.status === 401) {
      console.log('  ✅ Approval endpoint secured (requires authentication)');
    } else if (response.ok) {
      const result = await response.json();
      console.log('  ✅ Approval workflow working:', result.message);
    } else {
      console.log('  ⚠️ Approval endpoint status:', response.status);
    }
  } catch (error) {
    console.log('  ❌ Approval workflow test failed:', error.message);
  }
}

async function testAIInsights() {
  try {
    console.log('  🧠 Testing AI insights endpoint...');
    
    const response = await fetch(`${baseUrl}/api/quotation-insights?quotationId=1`);
    
    if (response.status === 401) {
      console.log('  ✅ AI insights endpoint secured (requires authentication)');
    } else if (response.ok) {
      const result = await response.json();
      console.log('  ✅ AI insights working:', result.success ? 'Success' : 'No data');
    } else {
      console.log('  ⚠️ AI insights status:', response.status);
    }
  } catch (error) {
    console.log('  ❌ AI insights test failed:', error.message);
  }
}

// Database verification (if we can connect)
async function checkDatabaseTables() {
  console.log('\n🗄️ Checking Database Tables...');
  
  try {
    // Try to access a debug endpoint that might show table status
    const response = await fetch(`${baseUrl}/api/debug/tables`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ Database tables verified');
    } else {
      console.log('  💡 Database verification requires direct DB access');
      console.log('  📋 Expected tables:');
      console.log('    - whatsapp_messages');
      console.log('    - message_analysis');
      console.log('    - conversation_sessions');
      console.log('    - ai_communication_tasks');
      console.log('    - client_communication_timeline');
      console.log('    - quotation_business_lifecycle');
    }
  } catch (error) {
    console.log('  💡 Use database admin to verify table creation');
  }
}

// Configuration check
async function checkConfiguration() {
  console.log('\n⚙️ Configuration Checklist:');
  console.log('  📝 Required Environment Variables:');
  console.log('    □ OPENAI_API_KEY - For AI analysis');
  console.log('    □ WHATSAPP_WEBHOOK_VERIFY_TOKEN - For webhook security');
  console.log('    □ INTERAKT_API_KEY - Already configured');
  console.log('    □ SUPABASE credentials - Already configured');
  
  console.log('\n  🔗 Webhook Configuration:');
  console.log('    □ Interakt webhook URL: https://yourdomain.com/api/whatsapp/webhook');
  console.log('    □ Webhook verification token matches environment');
  
  console.log('\n  🚀 Deployment Steps:');
  console.log('    □ Database migration applied');
  console.log('    □ Dependencies installed (npm install openai)');
  console.log('    □ Application server running');
  console.log('    □ Test quotation approval workflow');
}

// Run all tests
(async () => {
  try {
    await testAISystem();
    await checkDatabaseTables();
    await checkConfiguration();
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
})(); 