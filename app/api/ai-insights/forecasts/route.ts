import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { AIMLService } from '@/lib/ai-ml-service'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required',
        database: 'PostgreSQL localhost:5432'
      }, { status: 403 })
    }

    const body = await request.json()
    const { period = 'monthly' } = body
    const startTime = Date.now()
    
    const client = await pool.connect()
    
    try {
      console.log(`🔮 Generating revenue forecasts for period: ${period}`)
      
      // Get historical data for AI forecasting with PostgreSQL analytics
      const { rows: historicalData } = await client.query(`
        WITH monthly_revenue AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as quotation_count,
            SUM(COALESCE(amount, 0)) as total_revenue,
            AVG(COALESCE(amount, 0)) as avg_quotation_value,
            COUNT(*) FILTER (WHERE workflow_status = 'approved') as approved_count,
            SUM(COALESCE(amount, 0)) FILTER (WHERE workflow_status = 'approved') as approved_revenue
          FROM quotations
          WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month
        ),
        lead_conversion AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE status = 'converted') as converted_leads
          FROM leads
          WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', created_at)
        ),
        employee_performance AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(DISTINCT created_by) as active_sales_people,
            AVG(COALESCE(amount, 0)) as avg_deal_size
          FROM quotations
          WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', created_at)
        )
        SELECT 
          mr.month,
          mr.total_revenue,
          mr.quotation_count,
          mr.avg_quotation_value,
          mr.approved_count,
          mr.approved_revenue,
          COALESCE(lc.total_leads, 0) as total_leads,
          COALESCE(lc.converted_leads, 0) as converted_leads,
          CASE 
            WHEN lc.total_leads > 0 
            THEN (lc.converted_leads::float / lc.total_leads * 100)
            ELSE 0 
          END as conversion_rate,
          COALESCE(ep.active_sales_people, 0) as active_sales_people,
          COALESCE(ep.avg_deal_size, 0) as avg_deal_size,
          LAG(mr.total_revenue) OVER (ORDER BY mr.month) as prev_month_revenue,
          CASE 
            WHEN LAG(mr.total_revenue) OVER (ORDER BY mr.month) > 0
            THEN ((mr.total_revenue - LAG(mr.total_revenue) OVER (ORDER BY mr.month)) / 
                  LAG(mr.total_revenue) OVER (ORDER BY mr.month) * 100)
            ELSE 0
          END as revenue_growth_rate
        FROM monthly_revenue mr
        LEFT JOIN lead_conversion lc ON mr.month = lc.month
        LEFT JOIN employee_performance ep ON mr.month = ep.month
        ORDER BY mr.month
      `)
      
      // Generate AI-powered revenue forecasts
      const forecastStart = Date.now()
      const forecasts = await AIMLService.generateRevenueForecast(period)
      const forecastTime = Date.now() - forecastStart
      
      // Store forecasts in PostgreSQL with transaction
      await client.query('BEGIN')
      
      try {
        const { rows: storedForecast } = await client.query(`
          INSERT INTO revenue_forecasts (
            forecast_period,
            forecast_data,
            historical_data,
            confidence_score,
            methodology,
            created_by,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id, created_at
        `, [
          period,
          JSON.stringify(forecasts),
          JSON.stringify(historicalData),
          0.85, // Default confidence score
          'AI/ML Enhanced with PostgreSQL Analytics',
          currentUser.id
        ])
        
        await client.query('COMMIT')
        
        const totalTime = Date.now() - startTime
        
        console.log(`✅ Revenue forecast generated and stored in ${totalTime}ms`)
        
        return NextResponse.json({
          success: true,
          period,
          forecasts: {
            ...forecasts,
            historical_analysis: {
              data_points: historicalData.length,
              total_revenue_12m: historicalData.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0),
              avg_monthly_revenue: historicalData.length > 0 ? 
                (historicalData.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0) / historicalData.length).toFixed(2) : 0,
              avg_conversion_rate: historicalData.length > 0 ?
                (historicalData.reduce((sum, row) => sum + parseFloat(row.conversion_rate || 0), 0) / historicalData.length).toFixed(2) + '%' : '0%',
              growth_trend: historicalData.length > 1 ? 
                (historicalData[historicalData.length - 1].revenue_growth_rate || 0).toFixed(2) + '%' : 'N/A'
            }
          },
          stored_forecast: {
            id: storedForecast[0].id,
            created_at: storedForecast[0].created_at
          },
          generated_at: new Date().toISOString(),
          performance: {
            total_time: `${totalTime}ms`,
            data_analysis_time: `${forecastStart - startTime}ms`,
            ai_forecast_time: `${forecastTime}ms`,
            database_storage_time: `${Date.now() - forecastStart - forecastTime}ms`
          },
          metadata: {
            source: 'PostgreSQL + AI/ML Enhanced Forecasting',
            database: 'PostgreSQL localhost:5432',
            historical_months: historicalData.length,
            methodology: 'Advanced Analytics with Machine Learning'
          }
        })
        
      } catch (dbError) {
        await client.query('ROLLBACK')
        throw dbError
      }
      
    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Error generating PostgreSQL revenue forecasts:', error)
    return NextResponse.json({
      error: 'Failed to generate revenue forecasts',
      details: {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      database: 'PostgreSQL localhost:5432'
    }, { status: 500 })
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
    const startTime = Date.now()
    
    const client = await pool.connect()

    try {
      console.log(`📊 Fetching revenue forecasts for period: ${period}`)
      
      // Enhanced PostgreSQL query for forecasts with analytics
      const { rows: forecasts } = await client.query(`
        SELECT 
          id,
          forecast_period,
          forecast_data,
          historical_data,
          confidence_score,
          methodology,
          created_by,
          created_at,
          EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_ago,
          ROW_NUMBER() OVER (PARTITION BY forecast_period ORDER BY created_at DESC) as recency_rank
        FROM revenue_forecasts 
        WHERE forecast_period = $1
        ORDER BY created_at DESC 
        LIMIT $2
      `, [period, limit])

      // Get business trends with PostgreSQL analytics
      const { rows: trends } = await client.query(`
        WITH trend_analysis AS (
          SELECT 
            'revenue' as trend_type,
            DATE_TRUNC('month', created_at) as period,
            SUM(COALESCE(amount, 0)) as value,
            COUNT(*) as transaction_count
          FROM quotations
          WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
          
          UNION ALL
          
          SELECT 
            'leads' as trend_type,
            DATE_TRUNC('month', created_at) as period,
            COUNT(*) as value,
            COUNT(*) FILTER (WHERE status = 'converted') as transaction_count
          FROM leads
          WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', created_at)
        ),
        trend_calculations AS (
          SELECT 
            trend_type,
            period,
            value,
            transaction_count,
            LAG(value) OVER (PARTITION BY trend_type ORDER BY period) as prev_value,
            CASE 
              WHEN LAG(value) OVER (PARTITION BY trend_type ORDER BY period) > 0
              THEN ((value - LAG(value) OVER (PARTITION BY trend_type ORDER BY period)) / 
                    LAG(value) OVER (PARTITION BY trend_type ORDER BY period) * 100)
              ELSE 0
            END as growth_rate
          FROM trend_analysis
        )
        SELECT 
          trend_type,
          json_agg(
            json_build_object(
              'period', period,
              'value', value,
              'growth_rate', COALESCE(growth_rate, 0),
              'transaction_count', transaction_count
            ) ORDER BY period
          ) as trend_data,
          AVG(COALESCE(growth_rate, 0)) as avg_growth_rate,
          NOW() as analyzed_at
        FROM trend_calculations
        GROUP BY trend_type
        ORDER BY trend_type
      `)

      // Current business metrics
      const { rows: currentMetrics } = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM quotations WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as quotations_30d,
          (SELECT SUM(COALESCE(amount, 0)) FROM quotations WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_30d,
          (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_30d,
          (SELECT COUNT(*) FROM leads WHERE status = 'converted' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as conversions_30d,
          (SELECT COUNT(DISTINCT created_by) FROM quotations WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as active_sales_people
      `)

      const queryTime = Date.now() - startTime
      
      console.log(`✅ Forecasts fetched in ${queryTime}ms`)
      console.log(`   └─ Found ${forecasts.length} forecasts`)
      console.log(`   └─ Analyzed ${trends.length} business trends`)

      return NextResponse.json({
        forecasts: forecasts.map(forecast => ({
          ...forecast,
          forecast_data: typeof forecast.forecast_data === 'string' ? 
            JSON.parse(forecast.forecast_data) : forecast.forecast_data,
          historical_data: typeof forecast.historical_data === 'string' ? 
            JSON.parse(forecast.historical_data) : forecast.historical_data,
          hours_ago: parseFloat(forecast.hours_ago).toFixed(1),
          is_latest: forecast.recency_rank === 1
        })),
        trends: trends.map(trend => ({
          ...trend,
          trend_data: typeof trend.trend_data === 'string' ? 
            JSON.parse(trend.trend_data) : trend.trend_data,
          avg_growth_rate: parseFloat(trend.avg_growth_rate || 0).toFixed(2) + '%'
        })),
        current_metrics: {
          ...currentMetrics[0],
          conversion_rate: currentMetrics[0].leads_30d > 0 ?
            (parseInt(currentMetrics[0].conversions_30d) / parseInt(currentMetrics[0].leads_30d) * 100).toFixed(2) + '%' : '0%',
          avg_deal_size: currentMetrics[0].quotations_30d > 0 ?
            (parseFloat(currentMetrics[0].revenue_30d) / parseInt(currentMetrics[0].quotations_30d)).toFixed(2) : '0'
        },
        analytics: {
          period,
          limit,
          query_performance: `${queryTime}ms`,
          forecast_count: forecasts.length,
          trend_categories: trends.length
        },
        metadata: {
          source: 'PostgreSQL Enhanced Analytics',
          database: 'PostgreSQL localhost:5432',
          generated_at: new Date().toISOString(),
          features: [
            'Revenue Forecasting',
            'Trend Analysis', 
            'Performance Metrics',
            'Growth Rate Calculations',
            'Real-time Business Intelligence'
          ]
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Error fetching PostgreSQL forecasts:', error)
    return NextResponse.json({
      error: 'Failed to fetch forecasts',
      details: {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      },
      database: 'PostgreSQL localhost:5432'
    }, { status: 500 })
  }
} 