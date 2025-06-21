#!/usr/bin/env node

/**
 * Universal AI Demo Setup Script
 * Populates the system with demo data and tests functionality
 */

const BASE_URL = 'http://localhost:3000'

async function makeRequest(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    
    if (data) {
      options.body = JSON.stringify(data)
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const result = await response.json()
    
    return { success: response.ok, data: result, status: response.status }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function setupDemo() {
  console.log('🌟 Setting up Universal Business Intelligence Demo')
  console.log('=' .repeat(50))
  
  // Step 1: Setup the system
  console.log('\n1️⃣ Setting up Universal BI System...')
  const setup = await makeRequest('POST', '/api/business-intelligence/setup')
  console.log(setup.success ? '✅ Setup complete' : '❌ Setup failed')
  
  // Step 2: Add demo communications
  console.log('\n2️⃣ Adding demo communications...')
  
  // Demo Email 1
  const email1 = await makeRequest('POST', '/api/webhooks/email', {
    email: {
      messageId: 'demo_email_001',
      from: 'ramya.bride@gmail.com',
      to: 'info@zgstudios.com',
      subject: 'Wedding Photography Inquiry - March 2025',
      body: 'Hi, I am Ramya and I am getting married on March 15th, 2025 in Chennai. I would like to book your wedding photography services. Could you please send me your packages and pricing? My budget is around ₹50,000.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }
  })
  console.log(email1.success ? '✅ Email 1 added' : '❌ Email 1 failed')
  
  // Demo Email 2
  const email2 = await makeRequest('POST', '/api/webhooks/email', {
    email: {
      messageId: 'demo_email_002',
      from: 'priya.wedding@yahoo.com',
      to: 'info@zgstudios.com',
      subject: 'Pre-wedding Shoot Booking',
      body: 'Hello, I saw your Instagram page and loved your work! I want to book a pre-wedding shoot for January 2025. What are your available dates and packages?',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }
  })
  console.log(email2.success ? '✅ Email 2 added' : '❌ Email 2 failed')
  
  // Demo Call 1
  const call1 = await makeRequest('POST', '/api/webhooks/calls', {
    transcript: 'Hello, this is Ramya. I sent an email yesterday about wedding photography for March 15th. I wanted to discuss the packages in detail. Can we schedule a meeting? I am particularly interested in the full-day coverage package.',
    call_id: 'demo_call_001',
    from: '+919876543210',
    to: '+918765432109',
    duration: 180,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  })
  console.log(call1.success ? '✅ Call 1 added' : '❌ Call 1 failed')
  
  // Demo Call 2
  const call2 = await makeRequest('POST', '/api/webhooks/calls', {
    transcript: 'Hi, this is Priya calling about the pre-wedding shoot. I checked your Instagram and I love the outdoor shots. Do you have any packages for beach photography? My fiancé and I are looking for something romantic.',
    call_id: 'demo_call_002',
    from: '+919123456789',
    to: '+918765432109',
    duration: 240,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
  })
  console.log(call2.success ? '✅ Call 2 added' : '❌ Call 2 failed')
  
  // Step 3: Test the Universal AI
  console.log('\n3️⃣ Testing Universal AI Chat...')
  
  const testQueries = [
    'What communications do we have from Ramya?',
    'Show me all wedding inquiries',
    'What did Priya say about pre-wedding shoots?',
    'Who called us recently about photography?',
    'What are our recent email inquiries?'
  ]
  
  for (const query of testQueries) {
    console.log(`\n🤖 Query: "${query}"`)
    const result = await makeRequest('POST', '/api/ai-universal-chat', {
      message: query,
      userId: 'demo_user'
    })
    
    if (result.success) {
      console.log('✅ Response received')
      console.log(`📊 Confidence: ${result.data.confidence}`)
      console.log(`📱 Context: ${JSON.stringify(result.data.context_used)}`)
      console.log(`💬 Response: ${result.data.response.substring(0, 150)}...`)
    } else {
      console.log('❌ Query failed')
      console.log(`Error: ${result.error || JSON.stringify(result.data)}`)
    }
  }
  
  // Step 4: Check system status
  console.log('\n4️⃣ Checking system status...')
  const status = await makeRequest('GET', '/api/ai-universal-chat')
  if (status.success) {
    console.log('✅ System status retrieved')
    console.log(`📊 Total Communications: ${status.data.system_status?.total_communications || 0}`)
    console.log(`👥 Total Entities: ${status.data.system_status?.total_entities || 0}`)
    console.log(`📚 Total Knowledge: ${status.data.system_status?.total_knowledge_items || 0}`)
  } else {
    console.log('❌ Status check failed')
  }
  
  console.log('\n' + '=' .repeat(50))
  console.log('🎉 Universal Business Intelligence Demo Complete!')
  console.log('=' .repeat(50))
  console.log('\n💡 Try these queries:')
  console.log('• "What are our recent wedding inquiries?"')
  console.log('• "Show me communications from Ramya"')
  console.log('• "What did clients say about pre-wedding shoots?"')
  console.log('• "Who are our potential clients?"')
  
  console.log('\n🔗 Test manually:')
  console.log('curl -X POST http://localhost:3000/api/ai-universal-chat \\')
  console.log('  -H "Content-Type: application/json" \\')
  console.log('  -d \'{"message": "What are our recent communications?", "userId": "admin"}\'')
}

// Run the demo setup
setupDemo().catch(console.error) 