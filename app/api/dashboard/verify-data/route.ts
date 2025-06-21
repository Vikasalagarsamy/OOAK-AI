import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect()
    const startTime = Date.now()

    try {
      console.log('🔍 Starting comprehensive dashboard data verification with PostgreSQL')

      // Enhanced PostgreSQL analytics for dashboard verification
      const { rows: tasksAnalysis } = await client.query(`
        WITH task_analysis AS (
          SELECT 
            id,
            title,
            client_name,
            estimated_value,
            status,
            created_at,
            ai_generated,
            CASE 
              WHEN LOWER(client_name) LIKE '%test%' OR 
                   LOWER(title) LIKE '%test%' OR 
                   LOWER(client_name) LIKE '%mock%' OR
                   LOWER(title) LIKE '%demo%'
              THEN true
              ELSE false
            END as is_test_data,
            EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_ago
          FROM ai_tasks
          ORDER BY created_at DESC
        ),
        status_summary AS (
          SELECT 
            status,
            COUNT(*) as count,
            SUM(COALESCE(estimated_value, 0)) as total_value,
            AVG(COALESCE(estimated_value, 0)) as avg_value
          FROM ai_tasks
          GROUP BY status
        )
        SELECT 
          json_agg(
            json_build_object(
              'id', ta.id,
              'title', ta.title,
              'client_name', ta.client_name,
              'estimated_value', ta.estimated_value,
              'status', ta.status,
              'created_at', ta.created_at,
              'ai_generated', ta.ai_generated,
              'is_test_data', ta.is_test_data,
              'hours_ago', ta.hours_ago
            ) ORDER BY ta.created_at DESC
          ) as all_tasks,
          (SELECT COUNT(*) FROM task_analysis) as total_tasks,
          (SELECT COUNT(*) FROM task_analysis WHERE is_test_data = true) as test_entries,
          (SELECT COUNT(*) FROM task_analysis WHERE is_test_data = false) as real_entries,
          (SELECT json_agg(json_build_object('status', status, 'count', count, 'total_value', total_value, 'avg_value', avg_value)) FROM status_summary) as status_breakdown
        FROM task_analysis ta
      `)

      // Enhanced call analytics with PostgreSQL features
      const { rows: callAnalytics } = await client.query(`
        WITH transcription_analysis AS (
          SELECT 
            id,
            client_name,
            employee_name,
            transcript_text,
            confidence_score,
            created_at,
            LENGTH(transcript_text) as transcript_length,
            CASE 
              WHEN LOWER(client_name) LIKE '%test%' OR 
                   LOWER(client_name) LIKE '%demo%'
              THEN true
              ELSE false
            END as is_test_call,
            EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_ago
          FROM call_transcriptions
          ORDER BY created_at DESC
          LIMIT 10
        ),
        analytics_summary AS (
          SELECT 
            COUNT(*) as total_analytics,
            AVG(sentiment_score) as avg_sentiment,
            COUNT(DISTINCT call_id) as unique_calls
          FROM call_analytics
        )
        SELECT 
          json_agg(
            json_build_object(
              'id', ta.id,
              'client_name', ta.client_name,
              'employee_name', ta.employee_name,
              'confidence_score', ta.confidence_score,
              'created_at', ta.created_at,
              'transcript_length', ta.transcript_length,
              'is_test_call', ta.is_test_call,
              'hours_ago', ta.hours_ago
            ) ORDER BY ta.created_at DESC
          ) as recent_transcriptions,
          (SELECT COUNT(*) FROM call_transcriptions) as total_transcriptions,
          (SELECT total_analytics FROM analytics_summary) as total_analytics,
          (SELECT avg_sentiment FROM analytics_summary) as avg_sentiment,
          (SELECT unique_calls FROM analytics_summary) as unique_calls
        FROM transcription_analysis ta
      `)

      // Dashboard metrics with time-based analysis
      const { rows: dashboardMetrics } = await client.query(`
        WITH time_ranges AS (
          SELECT 
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_tasks,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_tasks,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_tasks,
            SUM(COALESCE(estimated_value, 0)) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_revenue,
            AVG(COALESCE(estimated_value, 0)) as avg_task_value
          FROM ai_tasks
        ),
        activity_trends AS (
          SELECT 
            DATE_TRUNC('day', created_at) as day,
            COUNT(*) as daily_tasks,
            SUM(COALESCE(estimated_value, 0)) as daily_revenue
          FROM ai_tasks
          WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('day', created_at)
          ORDER BY day DESC
        )
        SELECT 
          tr.*,
          json_agg(
            json_build_object(
              'day', at.day,
              'tasks', at.daily_tasks,
              'revenue', at.daily_revenue
            ) ORDER BY at.day DESC
          ) as weekly_trend
        FROM time_ranges tr
        CROSS JOIN activity_trends at
        GROUP BY tr.today_tasks, tr.week_tasks, tr.month_tasks, tr.month_revenue, tr.avg_task_value
      `)

      // Data quality assessment with PostgreSQL analytics
      const { rows: dataQuality } = await client.query(`
        SELECT 
          -- Task data quality
          (SELECT COUNT(*) FROM ai_tasks WHERE 
            client_name IS NOT NULL AND 
            title IS NOT NULL AND 
            estimated_value > 0) as complete_tasks,
          (SELECT COUNT(*) FROM ai_tasks) as total_tasks,
          
          -- Call data quality  
          (SELECT COUNT(*) FROM call_transcriptions WHERE 
            transcript_text IS NOT NULL AND 
            LENGTH(transcript_text) > 50) as quality_transcriptions,
          (SELECT COUNT(*) FROM call_transcriptions) as total_transcriptions,
          
          -- Recent activity indicators
          (SELECT MAX(created_at) FROM ai_tasks) as latest_task,
          (SELECT MAX(created_at) FROM call_transcriptions) as latest_call,
          
          -- Business metrics
          (SELECT COUNT(DISTINCT client_name) FROM ai_tasks WHERE client_name IS NOT NULL) as unique_clients,
          (SELECT COUNT(DISTINCT employee_name) FROM call_transcriptions WHERE employee_name IS NOT NULL) as active_employees
      `)

      const queryTime = Date.now() - startTime

      // Process results
      const tasksData = tasksAnalysis[0]
      const callData = callAnalytics[0]
      const metricsData = dashboardMetrics[0]
      const qualityData = dataQuality[0]

      const realDataPercentage = parseInt(tasksData.total_tasks) > 0 ? 
        Math.round((parseInt(tasksData.real_entries) / parseInt(tasksData.total_tasks)) * 100) : 0

      const completenessScore = parseInt(qualityData.total_tasks) > 0 ?
        Math.round((parseInt(qualityData.complete_tasks) / parseInt(qualityData.total_tasks)) * 100) : 0

      const analysis = {
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL localhost:5432',
        query_performance: `${queryTime}ms`,
        tasks: {
          total: parseInt(tasksData.total_tasks || 0),
          real_entries: parseInt(tasksData.real_entries || 0),
          test_entries: parseInt(tasksData.test_entries || 0),
          sample_data: (tasksData.all_tasks || []).slice(0, 3).map((t: any) => ({
            ...t,
            hours_ago: parseFloat(t.hours_ago).toFixed(1)
          })),
          status_breakdown: tasksData.status_breakdown || []
        },
        call_analytics: {
          transcriptions: parseInt(callData.total_transcriptions || 0),
          analytics: parseInt(callData.total_analytics || 0),
          unique_calls: parseInt(callData.unique_calls || 0),
          avg_sentiment: parseFloat(callData.avg_sentiment || 0).toFixed(2),
          recent_samples: (callData.recent_transcriptions || []).slice(0, 3).map((t: any) => ({
            ...t,
            hours_ago: parseFloat(t.hours_ago).toFixed(1)
          }))
        },
        dashboard_metrics: {
          today_tasks: parseInt(metricsData.today_tasks || 0),
          week_tasks: parseInt(metricsData.week_tasks || 0),
          month_tasks: parseInt(metricsData.month_tasks || 0),
          month_revenue: parseFloat(metricsData.month_revenue || 0),
          avg_task_value: parseFloat(metricsData.avg_task_value || 0).toFixed(2),
          weekly_trend: metricsData.weekly_trend || []
        },
        data_quality: {
          completeness_score: completenessScore,
          has_real_tasks: parseInt(tasksData.real_entries) > 0,
          has_call_data: parseInt(callData.total_transcriptions) > 0,
          unique_clients: parseInt(qualityData.unique_clients || 0),
          active_employees: parseInt(qualityData.active_employees || 0),
          latest_task_date: qualityData.latest_task,
          latest_call_date: qualityData.latest_call
        }
      }

      console.log(`✅ Dashboard verification completed in ${queryTime}ms`)
      console.log(`   └─ Total tasks: ${analysis.tasks.total}`)
      console.log(`   └─ Real data: ${realDataPercentage}%`)
      console.log(`   └─ Data completeness: ${completenessScore}%`)

      return NextResponse.json({
        success: true,
        analysis,
        summary: {
          total_tasks: analysis.tasks.total,
          real_data_percentage: realDataPercentage,
          completeness_score: completenessScore,
          has_live_call_data: analysis.call_analytics.transcriptions > 0,
          dashboard_shows_real_data: analysis.data_quality.has_real_tasks,
          unique_clients: analysis.data_quality.unique_clients,
          monthly_revenue: analysis.dashboard_metrics.month_revenue,
          recommendation: realDataPercentage >= 80 ? 
            "✅ Dashboard shows mostly real data" :
            realDataPercentage >= 50 ?
            "⚠️ Dashboard shows mixed real/test data" :
            "❌ Dashboard shows mostly test data"
        },
        insights: {
          performance: queryTime < 100 ? 'excellent' : queryTime < 500 ? 'good' : 'needs optimization',
          data_freshness: analysis.data_quality.latest_task_date ? 
            `Latest task: ${new Date(analysis.data_quality.latest_task_date).toLocaleDateString()}` : 'No recent tasks',
          business_activity: analysis.dashboard_metrics.today_tasks > 0 ? 'active' : 'low activity',
          call_analytics_health: analysis.call_analytics.transcriptions > 0 ? 'healthy' : 'no data'
        },
        metadata: {
          source: 'PostgreSQL Enhanced Dashboard Analytics',
          database: 'PostgreSQL localhost:5432',
          version: '2.0',
          features: [
            'Real vs Test Data Classification',
            'Data Quality Assessment',
            'Performance Monitoring',
            'Business Intelligence',
            'Trend Analysis'
          ]
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ PostgreSQL dashboard verification error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown PostgreSQL error',
      details: {
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL localhost:5432'
    }, { status: 500 })
  }
} 