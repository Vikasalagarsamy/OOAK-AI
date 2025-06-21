import { NextRequest, NextResponse } from 'next/server'
import { AITaskManagementService } from '@/services/ai-task-management-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params
    const { taskId } = resolvedParams
    const body = await request.json()
    const { status, completion_notes } = body

    console.log(`🔄 AI Task Update API: Updating task ${taskId} to status: ${status}`)

    const taskService = new AITaskManagementService()
    
    // Update task status
    const success = await taskService.updateTaskStatus(taskId, status, completion_notes)

    if (success) {
      console.log(`✅ AI Task Update API: Successfully updated task ${taskId}`)
      
      return NextResponse.json({
        success: true,
        message: `Task ${taskId} updated to ${status}`,
        task_id: taskId,
        new_status: status
      })
    } else {
      throw new Error('Failed to update task status')
    }
  } catch (error) {
    console.error('❌ AI Task Update API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params
    const { taskId } = resolvedParams

    // You can implement single task retrieval here if needed
    return NextResponse.json({
      success: true,
      message: 'Task retrieval endpoint',
      task_id: taskId
    })
  } catch (error) {
    console.error('❌ AI Task Retrieval API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 