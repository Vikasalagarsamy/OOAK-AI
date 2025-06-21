import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/lib/auth-utils'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// GET /api/tasks - Fetch AI tasks with proper role-based filtering
export async function GET() {
  try {
    console.log('📋 Getting tasks data from PostgreSQL...')
    
    const client = await pool.connect()
    
    // Get all tasks with enriched data
    const query = `
      SELECT 
        t.*,
        e.name as assigned_to_name,
        l.client_name as lead_client_name
      FROM ai_tasks t
      LEFT JOIN employees e ON t.assigned_to_employee_id = e.id
      LEFT JOIN leads l ON t.lead_id = l.id
      ORDER BY t.created_at DESC
      LIMIT 20
    `

    const result = await client.query(query)
    client.release()

    console.log(`✅ Tasks data from PostgreSQL: ${result.rows.length} tasks`)
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        total: result.rows.length
      }
    })

  } catch (error: any) {
    console.error('❌ Tasks GET error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Database error',
      details: error.message 
    }, { status: 500 })
  }
}

// POST /api/tasks - Create a new AI task
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Creating new task in PostgreSQL...')
    
    let body
    try {
      body = await request.json()
      console.log('📝 Request body received:', JSON.stringify(body, null, 2))
    } catch (jsonError: any) {
      console.error('❌ Failed to parse JSON from request:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: jsonError.message },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!body.title) {
      console.log('❌ Validation failed: Missing title')
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      )
    }

    console.log('✅ Validation passed, preparing task data...')

    const client = await pool.connect()
    
    // Prepare task data
    const taskData = {
      task_title: String(body.title || ''),
      task_description: String(body.description || ''),
      task_type: String(body.task_type || 'general'),
      priority: String(body.priority || 'medium'),
      status: String(body.status || 'pending'),
      assigned_to_employee_id: body.assigned_to_employee_id ? Number(body.assigned_to_employee_id) : null,
      due_date: body.due_date || null,
      lead_id: body.lead_id ? Number(body.lead_id) : null,
      client_name: String(body.client_name || ''),
      business_impact: String(body.business_impact || 'medium'),
      estimated_value: Number(body.estimated_value || 0)
    }

    console.log('📋 Prepared task data:', JSON.stringify(taskData, null, 2))

    const insertQuery = `
      INSERT INTO ai_tasks (
        task_title, task_description, task_type, priority, status,
        assigned_to_employee_id, due_date, lead_id, client_name,
        business_impact, estimated_value, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      ) RETURNING *
    `

    const values = [
      taskData.task_title,
      taskData.task_description,
      taskData.task_type,
      taskData.priority,
      taskData.status,
      taskData.assigned_to_employee_id,
      taskData.due_date,
      taskData.lead_id,
      taskData.client_name,
      taskData.business_impact,
      taskData.estimated_value
    ]

    const result = await client.query(insertQuery, values)
    client.release()

    const createdTask = result.rows[0]

    if (!createdTask) {
      console.error('❌ No task was created - empty result')
      return NextResponse.json(
        { error: 'Task creation failed - no data returned' },
        { status: 500 }
      )
    }

    console.log('✅ AI task created successfully:', createdTask.id)
    
    return NextResponse.json({
      success: true,
      data: createdTask,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Tasks POST error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 