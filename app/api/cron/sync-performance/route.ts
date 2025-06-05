import { NextRequest, NextResponse } from 'next/server'
import { RealtimeSyncService } from '@/lib/realtime-sync-service'

export async function GET(request: NextRequest) {
  try {
    console.log('⏰ Automated performance sync triggered')
    
    const result = await RealtimeSyncService.performFullSync()

    if (result.success) {
      console.log('✅ Automated sync completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Automated performance sync completed',
        details: result,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('❌ Automated sync failed:', result)
      return NextResponse.json(
        { error: 'Automated sync failed', details: result },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Automated sync error:', error)
    return NextResponse.json(
      { error: 'Automated sync failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Allow manual triggering of the sync
  return GET(request)
} 