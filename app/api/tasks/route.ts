import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/tasks - Fetch all AI tasks
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: tasks, error } = await supabase
      .from('ai_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Error fetching AI tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      )
    }

    console.log(`📋 Fetched ${tasks?.length || 0} AI tasks`)
    return NextResponse.json(tasks || [])
  } catch (error: any) {
    console.error('❌ Exception in GET /api/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create a new AI task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      )
    }

    // Prepare task data with proper schema mapping
    const taskData = {
      title: body.title,
      description: body.description || '',
      task_type: body.task_type || 'general',
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      assigned_to_employee_id: body.assigned_to_employee_id,
      assigned_by_user_id: body.assigned_by_user_id || 1,
      due_date: body.due_date,
      lead_id: body.lead_id,
      quotation_id: body.quotation_id,
      client_name: body.client_name,
      ai_generated: body.ai_generated !== false, // Default to true
      ai_confidence_score: body.ai_confidence_score || 0.8,
      ai_reasoning: body.ai_reasoning,
      business_impact: body.business_impact || 'medium',
      estimated_value: body.estimated_value,
      estimated_duration_minutes: body.estimated_duration_minutes || 30,
      optimal_time_start: body.optimal_time_start || 9,
      optimal_time_end: body.optimal_time_end || 17,
      timezone: body.timezone || 'UTC'
    }

    const { data: task, error } = await supabase
      .from('ai_tasks')
      .insert(taskData)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Error creating AI task:', error)
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ AI task created successfully:', task.id)
    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    console.error('❌ Exception in POST /api/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 