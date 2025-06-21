import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🆘 Emergency restart of AI Business System via API...')
    
    // Nuclear option - kill everything
    const killCommands = [
      'pkill -f python',
      'pkill -f node', 
      'pkill -f cloudflared',
      'pkill -f ollama',
      'lsof -ti:3000 | xargs kill -9 2>/dev/null || true',
      'lsof -ti:11434 | xargs kill -9 2>/dev/null || true'
    ]
    
    // Execute kill commands
    for (const command of killCommands) {
      try {
        await execAsync(command)
      } catch (error) {
        // Process might not be running, continue
        console.log(`No process to kill for: ${command}`)
      }
    }
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Restart everything
    const restartCommand = 'cd /Users/vikasalagarsamy/IMPORTANT && nohup ./start-permanent-ooak.sh > emergency-restart.log 2>&1 &'
    await execAsync(restartCommand)
    
    console.log('✅ Emergency restart completed')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Emergency restart completed - system restarting',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Emergency restart failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Emergency restart failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 