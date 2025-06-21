import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Website is healthy if this endpoint responds
    return NextResponse.json({ 
      success: true, 
      message: 'Website is healthy',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Website health check failed'
    }, { status: 500 })
  }
} 