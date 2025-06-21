#!/usr/bin/env node

// Test script to simulate Android call events and verify real-time monitoring

const BASE_URL = 'http://localhost:3000';

async function simulateCallEvent(eventType, phoneNumber, contactName) {
    const callData = {
        phoneNumber: phoneNumber,
        contactName: contactName,
        direction: 'outgoing',
        status: eventType,
        employeeId: 'EMP001',
        startTime: new Date().toISOString()
    };

    try {
        console.log(`🔄 Simulating ${eventType} event for ${phoneNumber}...`);
        
        const response = await fetch(`${BASE_URL}/api/call-monitoring`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Employee-ID': 'EMP001'
            },
            body: JSON.stringify(callData)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log(`✅ ${eventType} event sent successfully!`);
            console.log(`   📞 Phone: ${phoneNumber}`);
            console.log(`   📝 Status: ${eventType}`);
            console.log(`   🆔 Call ID: ${result.callId}`);
            return result.callId;
        } else {
            console.error(`❌ Failed to send ${eventType} event:`, result);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error sending ${eventType} event:`, error.message);
        return null;
    }
}

async function checkLatestCall() {
    try {
        console.log('\n🔍 Checking latest call data...');
        
        const response = await fetch(`${BASE_URL}/api/call-monitoring`);
        const data = await response.json();
        
        if (data.calls && data.calls.length > 0) {
            const latestCall = data.calls[0];
            console.log('📊 Latest call:');
            console.log(`   📞 Phone: ${latestCall.phone_number}`);
            console.log(`   👤 Contact: ${latestCall.client_name}`);
            console.log(`   📝 Status: ${latestCall.call_status}`);
            console.log(`   🕐 Time: ${latestCall.created_at}`);
            console.log(`   ⏱️ Duration: ${latestCall.duration}s`);
            return latestCall;
        } else {
            console.log('❌ No calls found');
            return null;
        }
    } catch (error) {
        console.error('❌ Error checking calls:', error.message);
        return null;
    }
}

async function testRealTimeCallFlow() {
    console.log('🚀 Testing Real-Time Call Monitoring Flow\n');
    
    const testPhone = '+919876543210';
    const testContact = 'Real-Time Test Call';
    
    // Step 1: Simulate call ringing
    const callId = await simulateCallEvent('ringing', testPhone, testContact);
    if (!callId) return;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Simulate call connected
    await simulateCallEvent('connected', testPhone, testContact);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Simulate call completed
    await simulateCallEvent('completed', testPhone, testContact);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Check the results
    console.log('\n' + '='.repeat(50));
    await checkLatestCall();
    console.log('='.repeat(50));
    
    console.log('\n✅ Real-time call simulation completed!');
    console.log('📊 Check the call monitoring dashboard at: http://localhost:3000/call-monitoring');
}

// Run the test
testRealTimeCallFlow().catch(console.error); 