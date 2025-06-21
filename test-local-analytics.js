// Simple test for local call analytics

async function testLocalAnalytics() {
  console.log('🧪 Testing Local Call Analytics...');
  
  try {
    // Test 1: Check webhook status
    console.log('\n1. Testing webhook status...');
    const statusResponse = await fetch('http://localhost:3000/api/webhooks/local-calls');
    const statusData = await statusResponse.json();
    console.log('✅ Webhook status:', statusData.success ? 'OK' : 'FAILED');
    
    // Test 2: Test manual transcript
    console.log('\n2. Testing manual transcript...');
    const testData = {
      type: 'manual_transcript',
      client_name: 'Test Client',
      sales_agent: 'Vikas',
      phone_number: '+91 12345 67890',
      transcript: 'Agent: Hello, this is a test call. Client: Hi, this is a test response.',
      duration: 60
    };
    
    const response = await fetch('http://localhost:3000/api/webhooks/local-calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Manual transcript test PASSED');
    } else {
      console.log('❌ Manual transcript test FAILED');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testLocalAnalytics(); 