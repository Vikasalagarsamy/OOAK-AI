import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    console.log(`🤖 AI Brain control: ${action}`)
    
    if (action === 'stop') {
      // More forceful stop with multiple methods
      try {
        console.log('🛑 Forcefully stopping AI Brain (Ollama)...')
        
        // Try multiple stop methods
        const stopCommands = [
          'pkill -9 -f ollama',
          'killall -9 ollama',
          'pkill -KILL -f "ollama serve"'
        ]
        
        for (const cmd of stopCommands) {
          try {
            await execAsync(cmd)
            console.log(`✅ Executed: ${cmd}`)
          } catch (error) {
            console.log(`⚠️ Command failed (process might not exist): ${cmd}`)
          }
        }
        
        // Wait a moment and verify it's stopped
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        try {
          const { stdout } = await execAsync('pgrep -f ollama')
          if (stdout.trim().length > 0) {
            console.log('⚠️ Ollama still running after kill attempts')
          } else {
            console.log('✅ Ollama successfully stopped')
          }
        } catch (error) {
          console.log('✅ Ollama successfully stopped (no processes found)')
        }
        
        console.log('🛑 AI Brain (Ollama) stop sequence complete')
        
        return NextResponse.json({ 
          success: true, 
          message: 'AI Brain stopped with force',
          service: 'aiBrain',
          action: 'stop',
          timestamp: new Date().toISOString()
        })
        
      } catch (error) {
        console.error('❌ Force stop failed:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to stop AI Brain',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
      
    } else if (action === 'start') {
      // Start ollama service
      try {
        console.log('🚀 Starting AI Brain (Ollama)...')
        await execAsync('ollama serve &')
        console.log('🚀 AI Brain (Ollama) started')
        
        // Wait a moment for it to start
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        return NextResponse.json({ 
          success: true, 
          message: 'AI Brain started successfully',
          service: 'aiBrain',
          action: 'start',
          timestamp: new Date().toISOString()
        })
        
      } catch (error) {
        console.error('❌ Start failed:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to start AI Brain',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
      
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Use "start" or "stop"'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ AI Brain control failed:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'AI Brain control failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 