import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [SIMPLE TASKS] Starting PostgreSQL tasks API...')
    
    // Test authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('❌ [SIMPLE TASKS] No current user found')
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }
    
    console.log(`✅ [SIMPLE TASKS] User authenticated: ${currentUser.username}`)
    
    const client = await pool.connect()
    
    // Enhanced query with employee details and task analytics
    const query = `
      SELECT 
        at.*,
        -- Employee details
        COALESCE(e.name, 
          CASE 
            WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
            THEN CONCAT(e.first_name, ' ', e.last_name)
            ELSE CONCAT('Employee #', e.id)
          END
        ) as assigned_to_name,
        e.department_id,
        d.name as department_name,
        -- Task analytics
        CASE 
          WHEN at.created_at::date = CURRENT_DATE THEN 'Today'
          WHEN at.created_at::date = CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
          WHEN at.created_at::date >= CURRENT_DATE - INTERVAL '7 days' THEN 'This Week'
          WHEN at.created_at::date >= CURRENT_DATE - INTERVAL '30 days' THEN 'This Month'
          ELSE 'Older'
        END as time_category,
        -- Priority scoring
        CASE 
          WHEN at.status = 'pending' AND at.priority = 'high' THEN 100
          WHEN at.status = 'pending' AND at.priority = 'medium' THEN 75
          WHEN at.status = 'pending' AND at.priority = 'low' THEN 50
          WHEN at.status = 'in_progress' THEN 90
          ELSE 25
        END as priority_score
      FROM ai_tasks at
      LEFT JOIN employees e ON at.assigned_to = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY priority_score DESC, at.created_at DESC
      LIMIT 20
    `

    const result = await client.query(query)
    client.release()

    console.log(`✅ [SIMPLE TASKS] Found ${result.rows.length} tasks from PostgreSQL`)

    // Add business analytics
    const taskStats = {
      total: result.rows.length,
      by_status: result.rows.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      by_priority: result.rows.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      by_time: result.rows.reduce((acc, task) => {
        acc[task.time_category] = (acc[task.time_category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      tasks: result.rows || [],
      count: result.rows?.length || 0,
      user: currentUser.username,
      analytics: taskStats,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        query_performance: "Enhanced with employee details and analytics"
      }
    })
    
  } catch (error: any) {
    console.error('❌ [SIMPLE TASKS] PostgreSQL Exception:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        source: "PostgreSQL Connection"
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 [SIMPLE TASKS] Creating new task in PostgreSQL...')
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, assigned_to, priority = 'medium', status = 'pending', task_type = 'general' } = body

    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    const client = await pool.connect()

    // Create task with transaction safety
    await client.query('BEGIN')
    
    try {
      const insertQuery = `
        INSERT INTO ai_tasks (
          title, 
          description, 
          assigned_to, 
          priority, 
          status, 
          task_type,
          created_by,
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING 
          *,
          CASE 
            WHEN $4 = 'high' THEN 100
            WHEN $4 = 'medium' THEN 75
            ELSE 50
          END as priority_score
      `
      
      const values = [
        title,
        description,
        assigned_to,
        priority,
        status,
        task_type,
        currentUser.employeeId || currentUser.id,
        new Date().toISOString(),
        new Date().toISOString()
      ]

      const result = await client.query(insertQuery, values)
      
      await client.query('COMMIT')
      client.release()

      console.log(`✅ [SIMPLE TASKS] Task created successfully: ${result.rows[0].id}`)

      return NextResponse.json({
        success: true,
        task: result.rows[0],
        message: 'Task created successfully in PostgreSQL'
      })

    } catch (insertError) {
      await client.query('ROLLBACK')
      client.release()
      throw insertError
    }

  } catch (error: any) {
    console.error('❌ [SIMPLE TASKS] Create task error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create task', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}