import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting dashboard data from PostgreSQL...')
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await pool.connect()

    // Optimized queries for dashboard metrics
    const metricsQuery = `
      WITH 
      quotation_metrics AS (
        SELECT 
          COUNT(*) as total_quotations,
          COUNT(*) FILTER (WHERE status = 'draft') as draft_quotations,
          COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_quotations,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_quotations,
          COALESCE(SUM(total_amount), 0) as total_quotation_value
        FROM quotations
      ),
      lead_metrics AS (
        SELECT 
          COUNT(*) as total_leads,
          COUNT(*) FILTER (WHERE status = 'NEW') as new_leads,
          COUNT(*) FILTER (WHERE status = 'QUALIFIED') as qualified_leads,
          COUNT(*) FILTER (WHERE status = 'WON') as won_leads,
          COUNT(*) FILTER (WHERE status = 'LOST') as lost_leads
        FROM leads
      ),
      task_metrics AS (
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_tasks,
          COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_tasks,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_tasks
        FROM ai_tasks
      ),
      team_metrics AS (
        SELECT 
          COUNT(*) as total_employees,
          COUNT(*) FILTER (WHERE status = 'active') as active_employees
        FROM employees
      ),
      department_metrics AS (
        SELECT COUNT(*) as total_departments
        FROM departments
      ),
      recent_activity AS (
        SELECT 
          (SELECT COUNT(*) FROM quotations WHERE created_at >= NOW() - INTERVAL '7 days') as new_quotations_7d,
          (SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '7 days') as new_leads_7d,
          (SELECT COUNT(*) FROM ai_tasks WHERE status = 'COMPLETED' AND updated_at >= NOW() - INTERVAL '7 days') as completed_tasks_7d
      )
      SELECT 
        qm.*,
        lm.*,
        tm.*,
        em.*,
        dm.*,
        ra.*
      FROM quotation_metrics qm
      CROSS JOIN lead_metrics lm
      CROSS JOIN task_metrics tm  
      CROSS JOIN team_metrics em
      CROSS JOIN department_metrics dm
      CROSS JOIN recent_activity ra
    `

    const result = await client.query(metricsQuery)
    client.release()

    const data = result.rows[0]

    // Structure the response data
    const metrics = {
      quotations: {
        total: parseInt(data.total_quotations),
        draft: parseInt(data.draft_quotations),
        pending: parseInt(data.pending_quotations),
        approved: parseInt(data.approved_quotations),
        total_value: parseFloat(data.total_quotation_value)
      },
      leads: {
        total: parseInt(data.total_leads),
        new: parseInt(data.new_leads),
        qualified: parseInt(data.qualified_leads),
        won: parseInt(data.won_leads),
        lost: parseInt(data.lost_leads)
      },
      tasks: {
        total: parseInt(data.total_tasks),
        pending: parseInt(data.pending_tasks),
        in_progress: parseInt(data.in_progress_tasks),
        completed: parseInt(data.completed_tasks)
      },
      team: {
        total_employees: parseInt(data.total_employees),
        active_employees: parseInt(data.active_employees),
        total_departments: parseInt(data.total_departments)
      }
    }

    const recentActivity = {
      new_quotations: parseInt(data.new_quotations_7d),
      new_leads: parseInt(data.new_leads_7d),
      completed_tasks: parseInt(data.completed_tasks_7d)
    }

    console.log('✅ Dashboard data from PostgreSQL loaded successfully')

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        recentActivity,
        timestamp: new Date().toISOString(),
        user: {
          id: currentUser.id,
          name: currentUser.username,
          role: currentUser.roleName
        }
      },
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Dashboard API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard data from database',
        details: error.message 
      },
      { status: 500 }
    )
  }
} 