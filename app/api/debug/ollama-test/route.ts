import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 DEBUG: Testing Ollama connection...')
    
    // Test multiple Ollama endpoints
    const tests = [
      { name: 'Root endpoint', url: 'http://localhost:11434' },
      { name: 'API tags', url: 'http://localhost:11434/api/tags' },
      { name: 'API version', url: 'http://localhost:11434/api/version' }
    ]
    
    const results = []
    
    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}: ${test.url}`)
        const response = await fetch(test.url, { 
          signal: AbortSignal.timeout(5000) 
        })
        
        const result = {
          name: test.name,
          url: test.url,
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          success: true
        }
        
        console.log(`✅ ${test.name}: ${response.status} ${response.ok ? 'OK' : 'NOT OK'}`)
        results.push(result)
        
      } catch (error) {
        const result = {
          name: test.name,
          url: test.url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        
        console.log(`❌ ${test.name}: ${result.error}`)
        results.push(result)
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })
    
  } catch (error) {
    console.error('❌ Debug test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 