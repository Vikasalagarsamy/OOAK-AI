import { NextRequest, NextResponse } from 'next/server'
import { RealtimeSyncService } from '@/lib/realtime-sync-service'
import { BusinessNotificationService } from '@/lib/business-notification-service'
import { createClient } from '@/lib/supabase/server'
import { AIMLService } from '@/lib/ai-ml-service'

// 🕐 Hourly Sync Cron Job
// This endpoint will be called every hour to automatically sync performance data
export async function GET(request: NextRequest) {
  try {
    console.log('🕐 Starting hourly performance sync...')
    
    // Verify this is a cron request (security check)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Sync quotation data to performance metrics
    const syncResult = await RealtimeSyncService.syncQuotationData()
    console.log('✅ Quotation sync completed:', syncResult)

    // 2. Sync team members
    await RealtimeSyncService.syncTeamMembers()
    console.log('✅ Team members synced')

    // 3. Generate fresh AI insights
    const supabase = createClient()
    const { data: teamMembers } = await supabase
      .from('sales_team_members')
      .select('*')
      .eq('is_active', true)
    
    const { data: performanceMetrics } = await supabase
      .from('sales_performance_metrics')
      .select('*')
      .order('metric_period', { ascending: false })

    const aiInsights = await AIMLService.generateManagementInsights(teamMembers || [], performanceMetrics || [])
    console.log('✅ AI insights generated:', aiInsights.length, 'insights')

    // 4. 🤖 Trigger AI-powered business notifications
    await triggerAINotifications()
    console.log('✅ AI-powered notifications triggered')

    // 5. Check for performance changes and send notifications
    await checkPerformanceChanges()
    console.log('✅ Performance change notifications sent')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      syncResult,
      aiInsights: aiInsights.length,
      message: 'Hourly sync completed successfully'
    })

  } catch (error) {
    console.error('❌ Hourly sync failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// 🤖 Trigger AI-powered notifications
async function triggerAINotifications() {
  try {
    console.log('🤖 Triggering AI-powered notifications...')
    
    // Call our AI notifications endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai-insights/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      console.log('✅ AI notifications triggered successfully')
    } else {
      console.error('❌ Failed to trigger AI notifications:', response.status)
    }
  } catch (error) {
    console.error('❌ Error triggering AI notifications:', error)
  }
}

// 📊 Check for performance changes and notify
async function checkPerformanceChanges() {
  const supabase = createClient()
  
  // Get current month's performance
  const currentPeriod = new Date().toISOString().slice(0, 7) + '-01'
  const { data: currentMetrics } = await supabase
    .from('sales_performance_metrics')
    .select('*')
    .eq('metric_period', currentPeriod)

  // Get last month's performance for comparison
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const lastPeriod = lastMonth.toISOString().slice(0, 7) + '-01'
  
  const { data: lastMetrics } = await supabase
    .from('sales_performance_metrics')
    .select('*')
    .eq('metric_period', lastPeriod)

  // Create performance change notifications using new business service
  if (currentMetrics && lastMetrics) {
    for (const current of currentMetrics) {
      const previous = lastMetrics.find(m => m.employee_id === current.employee_id)
      if (previous) {
        const scoreChange = current.performance_score - previous.performance_score
        const conversionChange = current.conversion_rate - previous.conversion_rate

        // Notify on significant changes (>10% improvement or >5% decline)
        if (Math.abs(scoreChange) > 1.0 || Math.abs(conversionChange) > 0.05) {
          // Get employee details
          const { data: employee } = await supabase
            .from('employees')
            .select('*')
            .eq('id', current.employee_id)
            .single()

          if (employee) {
            const anomalyType = scoreChange < -1.0 ? 'performance_decline' : 'performance_improvement'
            await BusinessNotificationService.notifyTeamPerformanceAnomaly(
              employee,
              anomalyType,
              {
                score_change: scoreChange,
                conversion_change: conversionChange,
                current_score: current.performance_score,
                current_conversion: current.conversion_rate
              }
            )
          }
        }
      }
    }
  }
} 