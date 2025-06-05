import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { RealtimeSyncService } from '@/lib/realtime-sync-service'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🚀 Manual real-time sync triggered by:', currentUser.username)
    
    const result = await RealtimeSyncService.performFullSync()

    return NextResponse.json({
      success: result.success,
      message: 'Real-time sync completed',
      details: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Real-time sync API error:', error)
    return NextResponse.json(
      { error: 'Failed to perform real-time sync' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const summary = await RealtimeSyncService.getRealtimePerformanceSummary()

    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Performance summary API error:', error)
    return NextResponse.json(
      { error: 'Failed to get performance summary' },
      { status: 500 }
    )
  }
} 