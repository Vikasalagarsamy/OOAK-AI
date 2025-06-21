import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { unlink, access } from 'fs/promises'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 EMERGENCY RECOVERY INITIATED')
    
    // Check if emergency stop flag exists
    let emergencyStopActive = false
    try {
      await access('.emergency-stop')
      emergencyStopActive = true
      console.log('🚩 Emergency stop flag detected - proceeding with recovery')
    } catch (error) {
      console.log('⚠️ No emergency stop flag found - recovery may not be needed')
    }
    
    // Remove emergency stop flag
    if (emergencyStopActive) {
      try {
        await unlink('.emergency-stop')
        console.log('✅ Emergency stop flag removed')
      } catch (error) {
        console.log('⚠️ Could not remove emergency stop flag:', error)
      }
    }
    
    // Start ollama service
    console.log('🚀 Restarting AI Brain (Ollama)...')
    try {
      await execAsync('ollama serve > /dev/null 2>&1 &')
      console.log('🚀 Ollama restart command executed')
    } catch (error) {
      console.log('⚠️ Ollama start command completed:', error)
    }
    
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Verify ollama is running
    let isRunning = false
    try {
      const { stdout } = await execAsync('pgrep -f ollama')
      if (stdout.trim().length > 0) {
        isRunning = true
        console.log('✅ AI Brain recovery successful - Ollama is running')
        console.log('📊 Process ID:', stdout.trim())
      } else {
        console.log('❌ AI Brain recovery failed - Ollama not detected')
      }
    } catch (error) {
      console.log('❌ AI Brain recovery failed - No ollama processes found')
    }
    
    console.log('🔧 EMERGENCY RECOVERY COMPLETE')
    
    return NextResponse.json({ 
      success: true, 
      message: isRunning ? 'Emergency recovery successful - AI Brain restored' : 'Recovery attempted but AI Brain may need manual restart',
      aiBrainRunning: isRunning,
      emergencyFlagRemoved: emergencyStopActive,
      autoRestartEnabled: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('💥 EMERGENCY RECOVERY FAILED:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Emergency recovery failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 