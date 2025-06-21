import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting AI Business System via API...')
    
    // Execute the startup script in background
    const command = 'cd /Users/vikasalagarsamy/IMPORTANT && nohup ./start-permanent-ooak.sh > startup.log 2>&1 &'
    
    await execAsync(command)
    
    console.log('✅ Business startup initiated')
    
    return NextResponse.json({ 
      success: true, 
      message: 'AI Business system startup initiated',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Business startup failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to start business system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 