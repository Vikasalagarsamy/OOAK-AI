import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test WhatsApp webhook endpoint - exactly like startup script
    const response = await fetch('https://api.ooak.photography/api/webhooks/whatsapp', { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout - same as startup script
    })
    
    // WhatsApp webhook should respond (any response means it's reachable)
    if (response.status >= 200 && response.status < 500) {
      return NextResponse.json({ 
        success: true, 
        message: 'WhatsApp webhook is reachable',
        timestamp: new Date().toISOString()
      })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'WhatsApp webhook not reachable',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 