import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Test if Whisper environment is available
    const { stdout } = await execAsync('cd /Users/vikasalagarsamy/IMPORTANT && source whisper-env/bin/activate && python -c "import faster_whisper; print(\\"OK\\")"')
    
    if (stdout.trim() === 'OK') {
      return NextResponse.json({ 
        success: true, 
        message: 'Whisper Large-V3 is ready',
        timestamp: new Date().toISOString()
      })
    } else {
      throw new Error('Whisper import failed')
    }
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Whisper Large-V3 not available',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 