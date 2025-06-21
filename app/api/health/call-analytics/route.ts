import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test call analytics endpoint - exactly like startup script
    const response = await fetch('https://api.ooak.photography/api/webhooks/local-calls', { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout - same as startup script
    })
    
    // Call analytics should respond (any response means it's reachable)
    if (response.status >= 200 && response.status < 500) {
      return NextResponse.json({ 
        success: true, 
        message: 'Call analytics endpoint is reachable',
        timestamp: new Date().toISOString()
      })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Call analytics endpoint not reachable',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 