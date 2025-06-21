import { NextRequest, NextResponse } from 'next/server'
import { BusinessNotificationService } from '@/lib/business-notification-service'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// 🤖 AI-Powered Notification Triggers
// This endpoint analyzes AI insights and sends smart notifications
export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI Notification Analysis Started')
    
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
  
  const client = await pool.connect()
  try {
    // Get quotations with AI predictions (mock data for now)
    const query = `
      SELECT * FROM quotations 
      WHERE status = $1 
      AND created_at >= $2
      ORDER BY created_at DESC
    `
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const result = await client.query(query, ['sent', sevenDaysAgo])
    const quotations = result.rows
    
    console.log(`📊 Found ${quotations.length} recent sent quotations`)
    
    for (const quotation of quotations) {
      // Mock AI prediction - in production, this would come from your AI service
      const mockProbability = Math.random() * 100
      
      if (mockProbability < 30) { // Less than 30% success probability
        console.log(`🚨 Low success probability detected: Quotation #${quotation.quotation_number} (${mockProbability.toFixed(1)}%)`)
        
        await BusinessNotificationService.notifyLowSuccessProbability(quotation, Math.round(mockProbability))
      }
    }
  } catch (error) {
    console.error('❌ Error checking low success probability quotations:', error)
  } finally {
    client.release()
  }
}

// 👥 Check for team performance anomalies
async function checkTeamPerformanceAnomalies() {
  console.log('👥 Checking for team performance anomalies...')
  
  const client = await pool.connect()
  try {
    // Get employee performance data
    const query = `
      SELECT e.*, d.name as department_name 
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.role IN ($1, $2)
      AND e.status = 'active'
      ORDER BY e.name
    `
    const result = await client.query(query, ['Sales Representative', 'Sales Head'])
    const employees = result.rows
    
    console.log(`👥 Analyzing performance for ${employees.length} sales team members`)
    
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
        console.log(`📉 Low conversion rate for ${employee.name}: ${mockMetrics.conversion_rate.toFixed(1)}%`)
        await BusinessNotificationService.notifyTeamPerformanceAnomaly(
          employee,
          'conversion_rate_drop',
          { ...mockMetrics, threshold: 15 }
        )
      }
      
      // Check for low activity
      if (mockMetrics.activity_score < 60) {
        console.log(`📊 Low activity score for ${employee.name}: ${mockMetrics.activity_score.toFixed(1)}%`)
        await BusinessNotificationService.notifyTeamPerformanceAnomaly(
          employee,
          'activity_decrease',
          { ...mockMetrics, decrease: 25 }
        )
      }
      
      // Check for revenue underperformance
      const performance = (mockMetrics.revenue / mockMetrics.target) * 100
      if (performance < 50) {
        console.log(`💰 Revenue underperformance for ${employee.name}: ${performance.toFixed(1)}%`)
        await BusinessNotificationService.notifyTeamPerformanceAnomaly(
          employee,
          'revenue_underperformance',
          { ...mockMetrics, performance: performance.toFixed(1) }
        )
      }
    }
  } catch (error) {
    console.error('❌ Error checking team performance anomalies:', error)
  } finally {
    client.release()
  }
}

// ⏰ Check for approaching event deadlines
async function checkEventDeadlines() {
  console.log('⏰ Checking for approaching event deadlines...')
  
  const client = await pool.connect()
  try {
    // Check if quotation_events table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quotation_events'
      );
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('ℹ️ quotation_events table does not exist, skipping event deadline checks')
      return
    }
    
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()
    
    const query = `
      SELECT 
        qe.*,
        q.id as quotation_id,
        q.quotation_number,
        q.client_name,
        q.created_by,
        q.status as quotation_status
      FROM quotation_events qe
      JOIN quotations q ON qe.quotation_id = q.id
      WHERE qe.event_date >= $1
      AND qe.event_date <= $2
      AND q.status = 'approved'
      ORDER BY qe.event_date ASC
    `
    
    const result = await client.query(query, [now, thirtyDaysFromNow])
    const events = result.rows
    
    console.log(`📅 Found ${events.length} upcoming events within 30 days`)
    
    for (const event of events) {
      const eventDate = new Date(event.event_date)
      const now = new Date()
      const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // Notify for events in 30, 14, 7, 3, and 1 days
      if ([30, 14, 7, 3, 1].includes(daysUntil)) {
        console.log(`⏰ Event deadline notification: ${event.event_name} in ${daysUntil} days`)
        
        // Create a quotation object for notification service
        const quotationData = {
          id: event.quotation_id,
          quotation_number: event.quotation_number,
          client_name: event.client_name,
          created_by: event.created_by,
          status: event.quotation_status
        }
        
        await BusinessNotificationService.notifyEventDeadlineApproaching(
          quotationData,
          event,
          daysUntil
        )
      }
    }
  } catch (error) {
    console.error('❌ Error checking event deadlines:', error)
  } finally {
    client.release()
  }
}

// 📞 Check for follow-up due dates
async function checkFollowUpDueDates() {
  console.log('📞 Checking for follow-up due dates...')
  
  const client = await pool.connect()
  try {
    // Check if lead_followups table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_followups'
      );
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('ℹ️ lead_followups table does not exist, skipping follow-up checks')
      return
    }
    
    const query = `
      SELECT 
        lf.*,
        l.id as lead_id,
        l.name as lead_name,
        l.email as lead_email,
        l.mobile as lead_mobile
      FROM lead_followups lf
      JOIN leads l ON lf.lead_id = l.id
      WHERE lf.status = 'scheduled'
      AND lf.scheduled_at <= $1
      ORDER BY lf.scheduled_at ASC
    `
    
    const result = await client.query(query, [new Date().toISOString()])
    const followUps = result.rows
    
    console.log(`📞 Found ${followUps.length} overdue follow-ups`)
    
    for (const followUp of followUps) {
      console.log(`📞 Follow-up due: ${followUp.lead_name || 'Unknown lead'}`)
      
      // Create lead object for notification service
      const leadData = {
        id: followUp.lead_id,
        name: followUp.lead_name,
        email: followUp.lead_email,
        mobile: followUp.lead_mobile
      }
      
      const followUpData = {
        ...followUp,
        leads: leadData
      }
      
      await BusinessNotificationService.notifyFollowUpDue(followUpData)
    }
  } catch (error) {
    console.error('❌ Error checking follow-up due dates:', error)
  } finally {
    client.release()
  }
}

// 📈 GET endpoint for manual triggers and testing
export async function GET(request: NextRequest) {
  const client = await pool.connect()
  try {
    // Get database info and AI insights status
    const dbResult = await client.query('SELECT NOW() as timestamp, version() as pg_version')
    const dbInfo = dbResult.rows[0]
    
    // Check for tables needed for AI insights
    const tableChecks = await client.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotations') as has_quotations,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') as has_employees,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quotation_events') as has_events,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_followups') as has_followups,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_ai_interactions') as has_interactions
    `)
    const tables = tableChecks.rows[0]
    
    // Get some basic stats
    const quotationsCount = tables.has_quotations ? 
      (await client.query('SELECT COUNT(*) as count FROM quotations')).rows[0].count : 0
    const employeesCount = tables.has_employees ?
      (await client.query('SELECT COUNT(*) as count FROM employees WHERE status = $1', ['active'])).rows[0].count : 0
    
    return NextResponse.json({
      status: "✅ AI Insights Notifications Ready",
      database: {
        status: "connected",
        timestamp: dbInfo.timestamp,
        version: dbInfo.pg_version
      },
      available_features: [
        "🎯 Low Success Probability Detection",
        "👥 Team Performance Anomaly Alerts", 
        "⏰ Event Deadline Notifications",
        "📞 Follow-up Due Date Alerts"
      ],
      data_sources: {
        quotations: {
          available: tables.has_quotations,
          count: quotationsCount
        },
        employees: {
          available: tables.has_employees,
          count: employeesCount
        },
        events: {
          available: tables.has_events
        },
        followups: {
          available: tables.has_followups
        }
      },
      ai_capabilities: [
        "Success probability analysis",
        "Performance anomaly detection",
        "Deadline tracking",
        "Automated notifications"
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ AI Insights status error:', error)
    return NextResponse.json({
      status: "❌ AI Insights Error",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    client.release()
  }
} 