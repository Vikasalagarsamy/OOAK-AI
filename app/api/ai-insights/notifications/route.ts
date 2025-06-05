import { NextRequest, NextResponse } from 'next/server'
import { BusinessNotificationService } from '@/lib/business-notification-service'
import { createClient } from '@/lib/supabase/server'

// 🤖 AI-Powered Notification Triggers
// This endpoint analyzes AI insights and sends smart notifications
export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI Notification Analysis Started')
    
    const supabase = createClient()
    
    // 1. Check for low success probability quotations
    await checkLowSuccessProbabilityQuotations()
    
    // 2. Check for performance anomalies
    await checkTeamPerformanceAnomalies()
    
    // 3. Check for event deadlines
    await checkEventDeadlines()
    
    // 4. Check for follow-up due dates
    await checkFollowUpDueDates()
    
    console.log('✅ AI Notification Analysis Completed')
    
    return NextResponse.json({
      success: true,
      message: 'AI notification analysis completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI Notification Analysis Failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 🎯 Check for quotations with low success probability
async function checkLowSuccessProbabilityQuotations() {
  console.log('🎯 Checking for low success probability quotations...')
  
  const supabase = createClient()
  
  try {
    // Get quotations with AI predictions (mock data for now)
    const { data: quotations } = await supabase
      .from('quotations')
      .select('*')
      .eq('status', 'sent')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
    
    if (!quotations) return
    
    for (const quotation of quotations) {
      // Mock AI prediction - in production, this would come from your AI service
      const mockProbability = Math.random() * 100
      
      if (mockProbability < 30) { // Less than 30% success probability
        console.log(`🚨 Low success probability detected: Quotation #${quotation.quotation_number} (${mockProbability.toFixed(1)}%)`)
        
        await BusinessNotificationService.notifyLowSuccessProbability(quotation, Math.round(mockProbability))
      }
    }
  } catch (error) {
    console.error('Error checking low success probability quotations:', error)
  }
}

// 👥 Check for team performance anomalies
async function checkTeamPerformanceAnomalies() {
  console.log('👥 Checking for team performance anomalies...')
  
  const supabase = createClient()
  
  try {
    // Get employee performance data (mock for now)
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .in('role', ['Sales Representative', 'Sales Head'])
    
    if (!employees) return
    
    for (const employee of employees) {
      // Mock performance metrics - in production, get from performance tables
      const mockMetrics = {
        conversion_rate: Math.random() * 100,
        activity_score: Math.random() * 100,
        revenue: Math.random() * 1000000,
        target: 500000
      }
      
      // Check for conversion rate drop
      if (mockMetrics.conversion_rate < 15) {
        await BusinessNotificationService.notifyTeamPerformanceAnomaly(
          employee,
          'conversion_rate_drop',
          { ...mockMetrics, threshold: 15 }
        )
      }
      
      // Check for low activity
      if (mockMetrics.activity_score < 60) {
        await BusinessNotificationService.notifyTeamPerformanceAnomaly(
          employee,
          'activity_decrease',
          { ...mockMetrics, decrease: 25 }
        )
      }
      
      // Check for revenue underperformance
      const performance = (mockMetrics.revenue / mockMetrics.target) * 100
      if (performance < 50) {
        await BusinessNotificationService.notifyTeamPerformanceAnomaly(
          employee,
          'revenue_underperformance',
          { ...mockMetrics, performance: performance.toFixed(1) }
        )
      }
    }
  } catch (error) {
    console.error('Error checking team performance anomalies:', error)
  }
}

// ⏰ Check for approaching event deadlines
async function checkEventDeadlines() {
  console.log('⏰ Checking for approaching event deadlines...')
  
  const supabase = createClient()
  
  try {
    const { data: events } = await supabase
      .from('quotation_events')
      .select(`
        *,
        quotations (
          id,
          quotation_number,
          client_name,
          created_by,
          status
        )
      `)
      .gte('event_date', new Date().toISOString())
      .lte('event_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()) // Next 30 days
      .eq('quotations.status', 'approved')
    
    if (!events) return
    
    for (const event of events) {
      const eventDate = new Date(event.event_date)
      const now = new Date()
      const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // Notify for events in 30, 14, 7, 3, and 1 days
      if ([30, 14, 7, 3, 1].includes(daysUntil)) {
        console.log(`⏰ Event deadline notification: ${event.event_name} in ${daysUntil} days`)
        
        await BusinessNotificationService.notifyEventDeadlineApproaching(
          event.quotations,
          event,
          daysUntil
        )
      }
    }
  } catch (error) {
    console.error('Error checking event deadlines:', error)
  }
}

// 📞 Check for follow-up due dates
async function checkFollowUpDueDates() {
  console.log('📞 Checking for follow-up due dates...')
  
  const supabase = createClient()
  
  try {
    const { data: followUps } = await supabase
      .from('lead_followups')
      .select(`
        *,
        leads (
          id,
          name,
          email,
          mobile
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
    
    if (!followUps) return
    
    for (const followUp of followUps) {
      console.log(`📞 Follow-up due: ${followUp.leads?.name || 'Unknown lead'}`)
      
      await BusinessNotificationService.notifyFollowUpDue(followUp)
    }
  } catch (error) {
    console.error('Error checking follow-up due dates:', error)
  }
}

// 📈 GET endpoint for manual triggers and testing
export async function GET(request: NextRequest) {
  return POST(request)
} 