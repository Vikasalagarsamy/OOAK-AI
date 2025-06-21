import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const employeeId = searchParams.get('employee_id') || '3' // default to Pooja

    const client = await pool.connect()
    
    try {
      // Lead conversion funnel analytics
      const funnelQuery = `
        SELECT 
          conversion_stage,
          COUNT(*) as count,
          AVG(expected_value) as avg_value,
          SUM(expected_value) as total_value,
          AVG(lead_score) as avg_score
        FROM leads 
        WHERE assigned_to = $1 
        AND created_at >= NOW() - INTERVAL '${period} days'
        AND status != 'REJECTED'
        GROUP BY conversion_stage
        ORDER BY 
          CASE conversion_stage
            WHEN 'new' THEN 1
            WHEN 'contacted' THEN 2
            WHEN 'interested' THEN 3
            WHEN 'quotation_sent' THEN 4
            WHEN 'negotiation' THEN 5
            WHEN 'won' THEN 6
            ELSE 7
          END
      `

      // Lead source performance
      const sourceQuery = `
        SELECT 
          lead_source,
          COUNT(*) as lead_count,
          AVG(lead_score) as avg_score,
          COUNT(CASE WHEN status = 'QUALIFIED' THEN 1 END) as qualified_count,
          AVG(expected_value) as avg_value,
          SUM(expected_value) as total_value
        FROM leads 
        WHERE assigned_to = $1 
        AND created_at >= NOW() - INTERVAL '${period} days'
        AND status != 'REJECTED'
        GROUP BY lead_source
        ORDER BY lead_count DESC
      `

      // Time-based performance
      const timeQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as leads_created,
          COUNT(CASE WHEN status = 'CONTACTED' THEN 1 END) as leads_contacted,
          COUNT(CASE WHEN status = 'QUALIFIED' THEN 1 END) as leads_qualified,
          AVG(lead_score) as avg_score,
          SUM(expected_value) as daily_pipeline
        FROM leads 
        WHERE assigned_to = $1 
        AND created_at >= NOW() - INTERVAL '${period} days'
        AND status != 'REJECTED'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `

      // Priority distribution
      const priorityQuery = `
        SELECT 
          priority,
          COUNT(*) as count,
          AVG(lead_score) as avg_score,
          AVG(expected_value) as avg_value,
          COUNT(CASE WHEN next_follow_up_date < NOW() THEN 1 END) as overdue_count
        FROM leads 
        WHERE assigned_to = $1 
        AND created_at >= NOW() - INTERVAL '${period} days'
        AND status != 'REJECTED'
        GROUP BY priority
        ORDER BY 
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
          END
      `

      // Wedding vs Corporate analytics
      const categoryQuery = `
        SELECT 
          CASE 
            WHEN wedding_date IS NOT NULL THEN 'Wedding'
            WHEN guest_count > 100 THEN 'Corporate'
            ELSE 'Other'
          END as category,
          COUNT(*) as count,
          AVG(expected_value) as avg_value,
          AVG(lead_score) as avg_score,
          AVG(guest_count) as avg_guests
        FROM leads 
        WHERE assigned_to = $1 
        AND created_at >= NOW() - INTERVAL '${period} days'
        AND status != 'REJECTED'
        GROUP BY 
          CASE 
            WHEN wedding_date IS NOT NULL THEN 'Wedding'
            WHEN guest_count > 100 THEN 'Corporate'
            ELSE 'Other'
          END
        ORDER BY count DESC
      `

      // Response time analytics
      const responseQuery = `
        SELECT 
          AVG(EXTRACT(hours FROM (last_contact_date - created_at))) as avg_response_hours,
          COUNT(CASE WHEN last_contact_date IS NOT NULL THEN 1 END) as contacted_leads,
          COUNT(CASE WHEN last_contact_date IS NULL THEN 1 END) as uncontacted_leads,
          AVG(CASE WHEN last_contact_date IS NOT NULL 
                   THEN EXTRACT(hours FROM (last_contact_date - created_at)) END) as contacted_avg_hours
        FROM leads 
        WHERE assigned_to = $1 
        AND created_at >= NOW() - INTERVAL '${period} days'
        AND status != 'REJECTED'
      `

      // Lead score distribution
      const scoreQuery = `
        SELECT 
          CASE 
            WHEN lead_score >= 80 THEN 'Excellent (80-100)'
            WHEN lead_score >= 60 THEN 'Good (60-79)'
            WHEN lead_score >= 40 THEN 'Fair (40-59)'
            ELSE 'Poor (0-39)'
          END as score_range,
          COUNT(*) as count,
          AVG(expected_value) as avg_value
        FROM leads 
        WHERE assigned_to = $1 
        AND created_at >= NOW() - INTERVAL '${period} days'
        AND status != 'REJECTED'
        GROUP BY 
          CASE 
            WHEN lead_score >= 80 THEN 'Excellent (80-100)'
            WHEN lead_score >= 60 THEN 'Good (60-79)'
            WHEN lead_score >= 40 THEN 'Fair (40-59)'
            ELSE 'Poor (0-39)'
          END
        ORDER BY MIN(lead_score) DESC
      `

      // Execute all queries in parallel
      const [
        funnelResults,
        sourceResults,
        timeResults,
        priorityResults,
        categoryResults,
        responseResults,
        scoreResults
      ] = await Promise.all([
        client.query(funnelQuery, [employeeId]),
        client.query(sourceQuery, [employeeId]),
        client.query(timeQuery, [employeeId]),
        client.query(priorityQuery, [employeeId]),
        client.query(categoryQuery, [employeeId]),
        client.query(responseQuery, [employeeId]),
        client.query(scoreQuery, [employeeId])
      ])

      // Calculate conversion rates
      const funnelData = funnelResults.rows
      const totalLeads = funnelData.reduce((sum, stage) => sum + parseInt(stage.count), 0)
      
      const funnelWithRates = funnelData.map(stage => ({
        ...stage,
        count: parseInt(stage.count),
        avg_value: parseFloat(stage.avg_value) || 0,
        total_value: parseFloat(stage.total_value) || 0,
        avg_score: parseFloat(stage.avg_score) || 0,
        conversion_rate: totalLeads > 0 ? ((parseInt(stage.count) / totalLeads) * 100).toFixed(1) : '0.0'
      }))

      // Process source performance
      const sourceData = sourceResults.rows.map(source => ({
        ...source,
        lead_count: parseInt(source.lead_count),
        qualified_count: parseInt(source.qualified_count),
        avg_score: parseFloat(source.avg_score) || 0,
        avg_value: parseFloat(source.avg_value) || 0,
        total_value: parseFloat(source.total_value) || 0,
        qualification_rate: source.lead_count > 0 ? 
          ((parseInt(source.qualified_count) / parseInt(source.lead_count)) * 100).toFixed(1) : '0.0'
      }))

      // Process time-based data
      const timeData = timeResults.rows.map(day => ({
        ...day,
        leads_created: parseInt(day.leads_created),
        leads_contacted: parseInt(day.leads_contacted),
        leads_qualified: parseInt(day.leads_qualified),
        avg_score: parseFloat(day.avg_score) || 0,
        daily_pipeline: parseFloat(day.daily_pipeline) || 0,
        contact_rate: day.leads_created > 0 ? 
          ((parseInt(day.leads_contacted) / parseInt(day.leads_created)) * 100).toFixed(1) : '0.0'
      }))

      // Process priority data
      const priorityData = priorityResults.rows.map(priority => ({
        ...priority,
        count: parseInt(priority.count),
        overdue_count: parseInt(priority.overdue_count),
        avg_score: parseFloat(priority.avg_score) || 0,
        avg_value: parseFloat(priority.avg_value) || 0,
        overdue_rate: priority.count > 0 ? 
          ((parseInt(priority.overdue_count) / parseInt(priority.count)) * 100).toFixed(1) : '0.0'
      }))

      // Process category data
      const categoryData = categoryResults.rows.map(category => ({
        ...category,
        count: parseInt(category.count),
        avg_value: parseFloat(category.avg_value) || 0,
        avg_score: parseFloat(category.avg_score) || 0,
        avg_guests: parseFloat(category.avg_guests) || 0
      }))

      // Process response data
      const responseData = responseResults.rows[0] || {}
      const processedResponseData = {
        avg_response_hours: parseFloat(responseData.avg_response_hours) || 0,
        contacted_leads: parseInt(responseData.contacted_leads) || 0,
        uncontacted_leads: parseInt(responseData.uncontacted_leads) || 0,
        contacted_avg_hours: parseFloat(responseData.contacted_avg_hours) || 0,
        total_leads: (parseInt(responseData.contacted_leads) || 0) + (parseInt(responseData.uncontacted_leads) || 0),
        contact_rate: responseData.contacted_leads > 0 && responseData.uncontacted_leads >= 0 ? 
          ((parseInt(responseData.contacted_leads) / 
            ((parseInt(responseData.contacted_leads) || 0) + (parseInt(responseData.uncontacted_leads) || 0))) * 100).toFixed(1) : '0.0'
      }

      // Process score distribution
      const scoreData = scoreResults.rows.map(score => ({
        ...score,
        count: parseInt(score.count),
        avg_value: parseFloat(score.avg_value) || 0
      }))

      const analytics = {
        period: parseInt(period),
        employee_id: parseInt(employeeId),
        generated_at: new Date().toISOString(),
        
        conversion_funnel: funnelWithRates,
        source_performance: sourceData,
        daily_performance: timeData,
        priority_distribution: priorityData,
        category_breakdown: categoryData,
        response_analytics: processedResponseData,
        score_distribution: scoreData,
        
        summary: {
          total_leads: totalLeads,
          total_pipeline: funnelWithRates.reduce((sum, stage) => sum + stage.total_value, 0),
          avg_lead_score: funnelWithRates.length > 0 ? 
            (funnelWithRates.reduce((sum, stage) => sum + (stage.avg_score * stage.count), 0) / totalLeads).toFixed(1) : '0',
          best_performing_source: sourceData.length > 0 ? sourceData[0].lead_source : 'N/A',
          response_time_hours: processedResponseData.contacted_avg_hours.toFixed(1)
        }
      }

      console.log(`✅ Generated analytics for employee ${employeeId} (${period} days)`)

      return NextResponse.json({
        success: true,
        analytics
      })
      
    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Error generating lead analytics:", error)
    return NextResponse.json({ 
      success: false,
      error: "An unexpected error occurred while generating analytics" 
    }, { status: 500 })
  }
} 