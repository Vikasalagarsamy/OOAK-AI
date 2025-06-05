import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { AIMLService } from '@/lib/ai-ml-service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Analyze sales team performance
    const teamPerformance = await AIMLService.analyzeSalesTeamPerformance()

    if (!teamPerformance) {
      return NextResponse.json({ error: 'No team performance data available' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: teamPerformance,
      analyzed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching team performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team performance data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Generate fresh team performance analysis
    const teamPerformance = await AIMLService.analyzeSalesTeamPerformance()

    return NextResponse.json({
      success: true,
      message: 'Team performance analysis updated successfully',
      data: teamPerformance,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating team performance analysis:', error)
    return NextResponse.json(
      { error: 'Failed to generate team performance analysis' },
      { status: 500 }
    )
  }
} 