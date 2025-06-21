import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/postgresql-client'
import { verifyAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth()
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📊 Fetching dashboard statistics...')

    // Get comprehensive dashboard stats
    const statsResult = await query(`
      SELECT 
        -- Lead statistics
        (SELECT COUNT(*) FROM leads) as total_leads,
        (SELECT COUNT(*) FROM leads WHERE created_at::date = CURRENT_DATE) as leads_today,
        (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as leads_this_week,
        (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_this_month,
        
        -- Client statistics
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM clients WHERE created_at::date = CURRENT_DATE) as clients_today,
        (SELECT COUNT(*) FROM clients WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as clients_this_week,
        (SELECT COUNT(*) FROM clients WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as clients_this_month,
        
        -- Employee statistics
        (SELECT COUNT(*) FROM employees) as total_employees,
        (SELECT COUNT(*) FROM employees WHERE created_at::date = CURRENT_DATE) as employees_today,
        (SELECT COUNT(*) FROM employees WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as employees_this_week,
        (SELECT COUNT(*) FROM employees WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as employees_this_month,
        
        -- Activity statistics
        (SELECT COUNT(*) FROM activities) as total_activities,
        (SELECT COUNT(*) FROM activities WHERE created_at::date = CURRENT_DATE) as today_activities,
        (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as activities_this_week,
        (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as activities_this_month,
        
        -- Company statistics
        (SELECT COUNT(*) FROM companies) as total_companies,
        (SELECT COUNT(*) FROM companies WHERE created_at::date = CURRENT_DATE) as companies_today,
        
        -- Vendor statistics
        (SELECT COUNT(*) FROM vendors WHERE status = 'active') as active_vendors,
        (SELECT COUNT(*) FROM vendors) as total_vendors,
        
        -- Task statistics (if tasks table exists)
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tasks') > 0 as has_tasks_table
    `)

    const stats = statsResult.rows[0]

    // If tasks table exists, get task stats
    let taskStats = {}
    if (stats.has_tasks_table) {
      const taskStatsResult = await query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN due_date::date = CURRENT_DATE THEN 1 END) as due_today
        FROM tasks
      `)
      taskStats = taskStatsResult.rows[0]
    }

    // Get trend data (compare with previous period)
    const trendsResult = await query(`
      SELECT 
        -- Previous week comparisons
        (SELECT COUNT(*) FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days') as leads_prev_week,
        (SELECT COUNT(*) FROM clients WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days') as clients_prev_week,
        (SELECT COUNT(*) FROM activities WHERE created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days') as activities_prev_week,
        
        -- Yesterday comparisons
        (SELECT COUNT(*) FROM leads WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day') as leads_yesterday,
        (SELECT COUNT(*) FROM clients WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day') as clients_yesterday,
        (SELECT COUNT(*) FROM activities WHERE created_at::date = CURRENT_DATE - INTERVAL '1 day') as activities_yesterday
    `)

    const trends = trendsResult.rows[0]

    // Calculate percentage changes
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { isPositive: current > 0, value: current > 0 ? 100 : 0 }
      const change = ((current - previous) / previous) * 100
      return {
        isPositive: change >= 0,
        value: Math.abs(Math.round(change))
      }
    }

    const response = {
      // Core statistics
      total_leads: parseInt(stats.total_leads || '0'),
      total_clients: parseInt(stats.total_clients || '0'),
      total_employees: parseInt(stats.total_employees || '0'),
      total_companies: parseInt(stats.total_companies || '0'),
      total_activities: parseInt(stats.total_activities || '0'),
      today_activities: parseInt(stats.today_activities || '0'),
      active_vendors: parseInt(stats.active_vendors || '0'),
      total_vendors: parseInt(stats.total_vendors || '0'),

      // Time-based breakdowns
      leads_today: parseInt(stats.leads_today || '0'),
      leads_this_week: parseInt(stats.leads_this_week || '0'),
      leads_this_month: parseInt(stats.leads_this_month || '0'),
      
      clients_today: parseInt(stats.clients_today || '0'),
      clients_this_week: parseInt(stats.clients_this_week || '0'),
      clients_this_month: parseInt(stats.clients_this_month || '0'),
      
      activities_this_week: parseInt(stats.activities_this_week || '0'),
      activities_this_month: parseInt(stats.activities_this_month || '0'),

      // Trends (week-over-week)
      trends: {
        leads: calculateTrend(
          parseInt(stats.leads_this_week || '0'),
          parseInt(trends.leads_prev_week || '0')
        ),
        clients: calculateTrend(
          parseInt(stats.clients_this_week || '0'),
          parseInt(trends.clients_prev_week || '0')
        ),
        activities: calculateTrend(
          parseInt(stats.activities_this_week || '0'),
          parseInt(trends.activities_prev_week || '0')
        )
      },

      // Daily trends
      daily_trends: {
        leads: calculateTrend(
          parseInt(stats.leads_today || '0'),
          parseInt(trends.leads_yesterday || '0')
        ),
        clients: calculateTrend(
          parseInt(stats.clients_today || '0'),
          parseInt(trends.clients_yesterday || '0')
        ),
        activities: calculateTrend(
          parseInt(stats.today_activities || '0'),
          parseInt(trends.activities_yesterday || '0')
        )
      },

      // Task statistics (if available)
      ...(stats.has_tasks_table && taskStats ? {
        total_tasks: parseInt(taskStats.total_tasks || '0'),
        pending_tasks: parseInt(taskStats.pending_tasks || '0'),
        active_tasks: parseInt(taskStats.active_tasks || '0'),
        completed_tasks: parseInt(taskStats.completed_tasks || '0'),
        tasks_due_today: parseInt(taskStats.due_today || '0')
      } : {}),

      // Metadata
      last_updated: new Date().toISOString(),
      timestamp: Date.now()
    }

    console.log(`✅ Retrieved dashboard statistics - ${response.total_leads} leads, ${response.total_clients} clients`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error fetching dashboard statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
} 