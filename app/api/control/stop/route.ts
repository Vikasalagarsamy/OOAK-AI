import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🛑 Stopping AI Business System via API...')
    
    // Stop all business processes safely
    const commands = [
      'pkill -f "cloudflared tunnel"',
      'pkill -f "next dev"', 
      'pkill -f "ollama serve"',
      'pkill -f "python.*whisper"'
    ]
    
    for (const command of commands) {
      try {
        await execAsync(command)
      } catch (error) {
        // Process might not be running, continue
        console.log(`Process not found for: ${command}`)
      }
    }
    
    console.log('✅ Business system stopped')
    
    return NextResponse.json({ 
      success: true, 
      message: 'AI Business system stopped safely',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Business stop failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to stop business system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 