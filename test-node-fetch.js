#!/usr/bin/env node

console.log('🔍 Testing Node.js fetch to Ollama...')

const testFetch = async () => {
  try {
    console.log('1. Testing basic fetch to Ollama...')
    
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: 'Say: Node.js fetch is working',
        stream: false
      })
    })

    console.log('2. Response status:', response.status)
    console.log('3. Response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Error response:', errorText)
      return
    }

    const data = await response.json()
    console.log('✅ Success! Response:', data.response)

  } catch (error) {
    console.error('❌ Fetch error:', error.message)
    console.error('Error details:', error)
  }
}

testFetch() 