import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { AIMLService } from '@/lib/ai-ml-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { period = 'monthly' } = body

    // Generate revenue forecasts
    const forecasts = await AIMLService.generateRevenueForecast(period)

    return NextResponse.json({
      success: true,
      period,
      forecasts,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating revenue forecasts:', error)
    return NextResponse.json(
      { error: 'Failed to generate revenue forecasts' },
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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly'
    const limit = parseInt(searchParams.get('limit') || '12')

    const supabase = createClient()

    // Get latest forecasts
    const { data: forecasts } = await supabase
      .from('revenue_forecasts')
      .select('*')
      .eq('forecast_period', period)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Get business trends
    const { data: trends } = await supabase
      .from('business_trends')
      .select('*')
      .order('analyzed_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      forecasts: forecasts || [],
      trends: trends || [],
      period
    })

  } catch (error) {
    console.error('Error fetching forecasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forecasts' },
      { status: 500 }
    )
  }
} 