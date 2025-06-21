import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'
import { getUserIdForDatabase } from '@/lib/uuid-helpers'

// PUT /api/tasks/[taskId] - Update a specific task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    const { query, transaction } = createClient()
    const resolvedParams = await params
    const { taskId } = resolvedParams
    const body = await request.json()

    console.log(`🔄 Updating task ${taskId}:`, body)

    // Update the task
    const { data: task, error } = await supabase
      .from('ai_tasks')
      .update({
        status: body.status,
        completion_notes: body.completion_notes,
        completed_at: body.status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Error updating task:', error)
      return NextResponse.json(
        { error: 'Failed to update task', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Task updated successfully:', task.id)
    return NextResponse.json(task)
  } catch (error: any) {
    console.error('❌ Exception in PUT /api/tasks/[taskId]:', error)
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
    const { query, transaction } = createClient()

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