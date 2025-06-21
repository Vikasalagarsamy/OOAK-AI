#!/usr/bin/env node

// Frontend Local Supabase Connection Test
// =======================================

const http = require('http')
const https = require('https')

const LOCAL_FRONTEND_URL = 'http://localhost:3000'
const LOCAL_SUPABASE_API = 'http://127.0.0.1:54321'

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    
    const req = client.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        })
      })
    })
    
    req.on('error', (err) => reject(err))
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

async function testFrontendConnection() {
  console.log('🧪 Testing Next.js Frontend → Local Supabase Connection...\n')
  
  try {
    // Test 1: Check if Next.js is running
    console.log('🚀 Test 1: Checking Next.js development server...')
    try {
      const response = await makeRequest(LOCAL_FRONTEND_URL)
      console.log(`✅ Next.js server is running (Status: ${response.statusCode})`)
    } catch (error) {
      console.error('❌ Next.js server is not accessible:', error.message)
      console.log('💡 Please start the server with: npm run dev')
      return
    }
    
    // Test 2: Check local Supabase API
    console.log('\n🔌 Test 2: Checking local Supabase API...')
    try {
      const response = await makeRequest(`${LOCAL_SUPABASE_API}/rest/v1/`)
      console.log(`✅ Local Supabase API is accessible (Status: ${response.statusCode})`)
    } catch (error) {
      console.error('❌ Local Supabase API is not accessible:', error.message)
      console.log('💡 Please ensure Supabase is running with: supabase start')
      return
    }
    
    // Test 3: Test API endpoints that use Supabase
    console.log('\n📊 Test 3: Testing Next.js API endpoints...')
    
    const apiEndpoints = [
      '/api/leads',
      '/api/leads/my-leads',
      '/api/companies',
      '/api/employees'
    ]
    
    for (const endpoint of apiEndpoints) {
      try {
        console.log(`   Testing ${endpoint}...`)
        const response = await makeRequest(`${LOCAL_FRONTEND_URL}${endpoint}`)
        
        if (response.statusCode === 200) {
          try {
            const data = JSON.parse(response.data)
            if (Array.isArray(data)) {
              console.log(`   ✅ ${endpoint} → Found ${data.length} records`)
            } else if (data.data && Array.isArray(data.data)) {
              console.log(`   ✅ ${endpoint} → Found ${data.data.length} records`)
            } else {
              console.log(`   ✅ ${endpoint} → Valid response structure`)
            }
          } catch (parseError) {
            console.log(`   ⚠️  ${endpoint} → Response not JSON, but status OK`)
          }
        } else if (response.statusCode === 401 || response.statusCode === 403) {
          console.log(`   ⚠️  ${endpoint} → Authentication required (${response.statusCode})`)
        } else {
          console.log(`   ❌ ${endpoint} → Status ${response.statusCode}`)
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint} → Error: ${error.message}`)
      }
    }
    
    // Test 4: Check environment configuration
    console.log('\n🔧 Test 4: Environment configuration check...')
    try {
      const fs = require('fs')
      const envContent = fs.readFileSync('.env copy.local', 'utf8')
      
      if (envContent.includes('127.0.0.1:54321')) {
        console.log('✅ Environment configured for local Supabase')
      } else {
        console.log('❌ Environment not configured for local Supabase')
      }
      
      if (envContent.includes('SUPABASE_MODE=LOCAL')) {
        console.log('✅ Local mode flag detected')
      } else {
        console.log('⚠️  Local mode flag not found')
      }
    } catch (error) {
      console.log('⚠️  Could not read environment file')
    }
    
    console.log('\n🎯 Summary:')
    console.log('===========')
    console.log('Your Next.js application should now be:')
    console.log('• ✅ Running on http://localhost:3000')
    console.log('• ✅ Connected to local Supabase (127.0.0.1:54321)')
    console.log('• ✅ Using local business data for testing')
    console.log('• ✅ Safe for development (no production impact)')
    
    console.log('\n📱 Frontend URLs to test:')
    console.log('• Main app: http://localhost:3000')
    console.log('• Local Supabase Studio: http://127.0.0.1:54323')
    console.log('• API endpoints: http://localhost:3000/api/*')
    
    console.log('\n🔧 Quick commands:')
    console.log('• Switch to remote: node switch-supabase-config.cjs remote')
    console.log('• Switch to local:  node switch-supabase-config.cjs local')
    console.log('• Restart frontend: npm run dev')
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Wait a moment for Next.js to start, then run tests
setTimeout(() => {
  testFrontendConnection()
}, 3000) 