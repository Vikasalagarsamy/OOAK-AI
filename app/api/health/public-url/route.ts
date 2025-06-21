import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test if public URL is reachable
    const response = await fetch('https://api.ooak.photography', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Public URL is reachable',
        timestamp: new Date().toISOString()
      })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Public URL not reachable',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 