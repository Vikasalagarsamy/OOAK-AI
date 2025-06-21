#!/usr/bin/env node

/**
 * Test the Large-v3 Translation API directly
 */

import FormData from 'form-data'
import fs from 'fs'
import fetch from 'node-fetch'

async function testTranslationAPI() {
  console.log('🧪 Testing Large-v3 Translation API directly...')
  
  try {
    // Test with manual text first (simpler)
    console.log('📝 Testing with manual text input...')
    
    const manualResponse = await fetch('http://localhost:3000/api/webhooks/local-calls-translation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'API Test Client',
        englishTranscript: 'Hello, I am interested in wedding photography services. Can you provide a quote?',
        callDuration: 30
      })
    })
    
    console.log('📊 Manual test response status:', manualResponse.status)
    const manualData = await manualResponse.json()
    console.log('📊 Manual test response:', JSON.stringify(manualData, null, 2))
    
    // Now test with file upload
    console.log('\n🎤 Testing with audio file upload...')
    
    const audioPath = 'uploads/call-recordings/5db1b0e2-4e7f-4e49-9f35-aa357fc0fc9a_1749312087865_1234567.mp3'
    
    if (!fs.existsSync(audioPath)) {
      console.error('❌ Audio file not found:', audioPath)
      return
    }
    
    const formData = new FormData()
    formData.append('audio', fs.createReadStream(audioPath))
    formData.append('clientName', 'File Upload Test Client')
    formData.append('modelSize', 'large-v3')
    
    console.log('⏳ Uploading file and processing...')
    const fileResponse = await fetch('http://localhost:3000/api/webhooks/local-calls-translation', {
      method: 'POST',
      body: formData
    })
    
    console.log('📊 File upload response status:', fileResponse.status)
    const fileData = await fileResponse.json()
    console.log('📊 File upload response:', JSON.stringify(fileData, null, 2))
    
  } catch (error) {
    console.error('❌ API test failed:', error)
  }
}

testTranslationAPI().catch(console.error) 