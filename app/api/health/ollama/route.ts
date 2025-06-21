import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test Ollama service - same as startup script
    const response = await fetch('http://localhost:11434', { 
      signal: AbortSignal.timeout(5000) // 5 second timeout - same as startup script
    })
    
    if (response.ok || response.status === 404) {
      // 404 is normal for Ollama root endpoint - means service is running
      return NextResponse.json({ 
        success: true, 
        message: 'Ollama AI service is running',
        timestamp: new Date().toISOString()
      })
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
    
  } catch (error) {
    if (error instanceof Error && error.name === 'ConnectTimeoutError') {
      return NextResponse.json({ 
        success: false, 
        error: 'Ollama AI service not responding'
      }, { status: 500 })
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Ollama AI service not responding',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 