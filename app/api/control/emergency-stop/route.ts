import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile } from 'fs/promises'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 EMERGENCY STOP ACTIVATED - NUCLEAR OPTION')
    
    // Create emergency stop flag to prevent auto-restart
    await writeFile('.emergency-stop', new Date().toISOString())
    console.log('🚩 Emergency stop flag created')
    
    // STEP 1: Kill the entire permanent startup system FIRST
    console.log('💀 KILLING PERMANENT STARTUP SYSTEM...')
    const systemKillCommands = [
      'pkill -9 -f "start-permanent-ooak"',
      'pkill -9 -f "permanent-ooak"', 
      'pkill -9 -f "ooak.sh"',
      'pkill -9 -f "cloudflared"',
      'pkill -KILL -f "tunnel"'
    ]
    
    for (const cmd of systemKillCommands) {
      try {
        await execAsync(cmd)
        console.log(`💀 System kill: ${cmd}`)
      } catch (error) {
        console.log(`⚠️ System kill completed: ${cmd}`)
      }
    }
    
    // STEP 2: Kill ALL ollama processes with EXTREME prejudice
    console.log('💥 NUKING ALL OLLAMA PROCESSES WITH EXTREME FORCE...')
    const nukeCommands = [
      'sudo pkill -9 ollama 2>/dev/null || true',
      'pkill -9 -f ollama',
      'killall -KILL ollama 2>/dev/null || true', 
      'pkill -KILL -f "ollama serve"',
      'pkill -9 -f "ollama.*"',
      'ps aux | grep ollama | grep -v grep | awk \'{print $2}\' | xargs kill -9 2>/dev/null || true'
    ]
    
    for (const cmd of nukeCommands) {
      try {
        await execAsync(cmd)
        console.log(`💥 NUKE: ${cmd}`)
        // Wait between each nuke attempt
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.log(`⚠️ Nuke completed: ${cmd}`)
      }
    }
    
    // STEP 3: Kill any monitoring/restart scripts AGGRESSIVELY
    console.log('🛑 DESTROYING ALL MONITORING PROCESSES...')
    const monitoringKillCommands = [
      'pkill -9 -f "start-permanent"',
      'pkill -9 -f "monitor"',
      'pkill -9 -f "restart"', 
      'pkill -9 -f "watchdog"',
      'pkill -9 -f "supervisor"',
      'pkill -9 -f "daemon"'
    ]
    
    for (const cmd of monitoringKillCommands) {
      try {
        await execAsync(cmd)
        console.log(`🛑 Monitor kill: ${cmd}`)
      } catch (error) {
        console.log(`⚠️ Monitor kill completed: ${cmd}`)
      }
    }
    
    // STEP 4: Multiple verification rounds with aggressive re-killing
    console.log('🔍 VERIFICATION AND RE-KILL SEQUENCE...')
    
    for (let round = 1; round <= 3; round++) {
      console.log(`🔍 Verification round ${round}/3`)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        const { stdout } = await execAsync('pgrep -f ollama')
        if (stdout.trim().length > 0) {
          console.log(`⚠️ Round ${round}: Ollama processes still detected: ${stdout.trim()}`)
          
          // Re-nuke any survivors
          const pids = stdout.trim().split('\n').filter(pid => pid.trim());
          for (const pid of pids) {
            try {
              await execAsync(`kill -9 ${pid.trim()}`)
              console.log(`💀 Re-killed PID: ${pid.trim()}`)
            } catch (error) {
              console.log(`⚠️ Re-kill attempt: ${pid.trim()}`)
            }
          }
        } else {
          console.log(`✅ Round ${round}: No ollama processes detected`)
          break;
        }
      } catch (error) {
        console.log(`✅ Round ${round}: No ollama processes found`)
        break;
      }
    }
    
    // FINAL VERIFICATION
    let finalSurvivors = false
    try {
      const { stdout } = await execAsync('pgrep -f ollama')
      if (stdout.trim().length > 0) {
        finalSurvivors = true
        console.log('🚨 FINAL WARNING: Ollama processes survived NUCLEAR ANNIHILATION')
        console.log('📊 Final survivors:', stdout.trim())
        console.log('💀 These processes may be protected by system-level services')
      } else {
        console.log('✅ NUCLEAR ANNIHILATION SUCCESSFUL - All ollama processes eliminated')
      }
    } catch (error) {
      console.log('✅ NUCLEAR ANNIHILATION SUCCESSFUL - No ollama processes detected')
    }
    
    console.log('🚨 EMERGENCY STOP COMPLETE')
    console.log('🚩 Auto-restart DISABLED until manual recovery')
    console.log('🔧 To recover: Remove .emergency-stop file and restart system')
    
    return NextResponse.json({ 
      success: true, 
      message: finalSurvivors ? 'NUCLEAR STRIKE EXECUTED - Some processes may be system-protected' : 'NUCLEAR STRIKE SUCCESSFUL - AI Brain completely eliminated',
      autoRestartDisabled: true,
      emergencyMode: true,
      systemKilled: true,
      processes: finalSurvivors ? 'Some system-protected processes survived' : 'All processes eliminated',
      recovery: 'Delete .emergency-stop file and restart system to recover',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('💥 NUCLEAR ANNIHILATION FAILED:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Nuclear annihilation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 