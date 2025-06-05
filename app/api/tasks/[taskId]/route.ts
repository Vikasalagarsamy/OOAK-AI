import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/tasks/[taskId] - Update a specific task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  try {
    const body = await request.json()
    const supabase = createClient()
    
    console.log(`🔄 Updating task ${taskId}:`, body)

    // Validate task ID
    if (!taskId || taskId === 'undefined') {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      )
    }

    // First, check if task exists and get current data
    const { data: existingTask, error: fetchError } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      console.error('❌ Task not found:', fetchError)
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Update status if provided
    if (body.status) {
      updateData.status = body.status.toUpperCase()
      
      // Set completion timestamp if status is completed
      if (body.status.toLowerCase() === 'completed') {
        updateData.completed_at = new Date().toISOString()
        if (body.actual_hours) {
          updateData.actual_hours = parseFloat(body.actual_hours)
        }
      } else {
        // Clear completion timestamp for non-completed status
        updateData.completed_at = null
        updateData.actual_hours = null
      }
    }

    // Update metadata with completion notes and other fields
    const existingMetadata = existingTask.metadata || {}
    const statusHistory = existingMetadata.status_history || []
    
    // Add new status history entry if status changed
    if (body.status && body.status.toUpperCase() !== existingTask.status) {
      statusHistory.push({
        from_status: existingTask.status,
        to_status: body.status.toUpperCase(),
        changed_at: new Date().toISOString(),
        changed_by: body.updated_by || 'system',
        notes: body.completion_notes || ''
      })
    }

    updateData.metadata = {
      ...existingMetadata,
      ...(body.completion_notes && { completion_notes: body.completion_notes }),
      ...(body.actual_hours && { actual_hours: parseFloat(body.actual_hours) }),
      ...(body.quality_rating && { quality_rating: parseInt(body.quality_rating) }),
      last_updated_by: body.updated_by || 'system',
      last_updated_at: new Date().toISOString(),
      status_history: statusHistory
    }

    // Update the task in database
    const { data: updatedTask, error } = await supabase
      .from('ai_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Database error updating task:', error)
      return NextResponse.json(
        { error: 'Failed to update task', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Task ${taskId} updated successfully to status: ${body.status}`)
    
    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Task updated to ${body.status} successfully`
    })

  } catch (error: any) {
    console.error(`❌ Exception updating task ${taskId}:`, error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/tasks/[taskId] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  try {
    const supabase = createClient()

    const { data: task, error } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error) {
      console.error('❌ Error fetching task:', error)
      return NextResponse.json(
        { error: 'Task not found', details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error: any) {
    console.error(`❌ Exception fetching task ${taskId}:`, error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 