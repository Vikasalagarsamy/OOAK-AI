import { NextRequest, NextResponse } from 'next/server'
import { callAnalyticsService } from '@/services/call-analytics-service'
import { createClient } from '@/lib/postgresql-client'

const { query, transaction } = createClient()

// Task call integration endpoint
export async function POST(request: NextRequest) {
  console.log('📞 Task call integration webhook received')
  
  try {
    const body = await request.json()
    console.log('📥 Task integration data:', JSON.stringify(body, null, 2))

    const { task_id, action, call_data } = body

    if (!task_id || !action) {
      return NextResponse.json({ 
        error: 'Task ID and action are required' 
      }, { status: 400 })
    }

    let result: any = {}

    switch (action) {
      case 'start_call':
        result = await handleCallStart(task_id, call_data)
        break
      case 'end_call':
        result = await handleCallEnd(task_id, call_data)
        break
      case 'upload_recording':
        result = await handleRecordingUpload(task_id, call_data)
        break
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported: start_call, end_call, upload_recording' 
        }, { status: 400 })
    }

    return NextResponse.json({ 
      status: 'success',
      message: `Task ${action} processed successfully`,
      result
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Task call integration error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleCallStart(taskId: string, callData: any): Promise<any> {
  console.log('🎬 Handling call start for task:', taskId)
  
  try {
    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // Update task status to in_progress with call metadata
    const { error: updateError } = await supabase
      .from('ai_tasks')
      .update({
        status: 'in_progress',
        metadata: {
          ...task.metadata,
          call_started: true,
          call_start_time: new Date().toISOString(),
          call_id: callData.call_id || `task_call_${taskId}_${Date.now()}`,
          call_initiated_by: callData.agent_name || 'System'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (updateError) {
      throw new Error(`Failed to update task: ${updateError.message}`)
    }

    console.log('✅ Call start recorded for task:', taskId)

    return {
      task_updated: true,
      call_id: callData.call_id || `task_call_${taskId}_${Date.now()}`,
      status: 'call_started'
    }

  } catch (error) {
    console.error('❌ Error handling call start:', error)
    throw error
  }
}

async function handleCallEnd(taskId: string, callData: any): Promise<any> {
  console.log('🏁 Handling call end for task:', taskId)
  
  try {
    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      throw new Error(`Task ${taskId} not found`)
    }

    const callId = task.metadata?.call_id || callData.call_id || `task_call_${taskId}`
    const callStartTime = task.metadata?.call_start_time
    const callEndTime = new Date().toISOString()
    
    // Calculate call duration
    const duration = callStartTime ? 
      Math.floor((new Date(callEndTime).getTime() - new Date(callStartTime).getTime()) / 1000) :
      callData.duration || 0

    // Update task with call completion
    const { error: updateError } = await supabase
      .from('ai_tasks')
      .update({
        metadata: {
          ...task.metadata,
          call_completed: true,
          call_end_time: callEndTime,
          call_duration: duration,
          call_outcome: callData.outcome || 'completed',
          call_notes: callData.notes || '',
          recording_available: !!callData.recording_url
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (updateError) {
      throw new Error(`Failed to update task: ${updateError.message}`)
    }

    // If recording is available, trigger transcription
    let transcriptionResult = null
    if (callData.recording_url) {
      transcriptionResult = await triggerCallTranscription(taskId, callId, callData, task)
    }

    console.log('✅ Call end recorded for task:', taskId)

    return {
      task_updated: true,
      call_id: callId,
      duration: duration,
      status: 'call_ended',
      transcription_triggered: !!transcriptionResult,
      transcription_id: transcriptionResult?.transcription_id
    }

  } catch (error) {
    console.error('❌ Error handling call end:', error)
    throw error
  }
}

async function handleRecordingUpload(taskId: string, callData: any): Promise<any> {
  console.log('📁 Handling recording upload for task:', taskId)
  
  try {
    // Get task details
    const { data: task, error: taskError } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      throw new Error(`Task ${taskId} not found`)
    }

    const callId = task.metadata?.call_id || callData.call_id || `task_call_${taskId}`

    // Update task with recording information
    const { error: updateError } = await supabase
      .from('ai_tasks')
      .update({
        metadata: {
          ...task.metadata,
          recording_available: true,
          recording_url: callData.recording_url,
          recording_uploaded_at: new Date().toISOString(),
          file_size: callData.file_size,
          file_format: callData.file_format
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (updateError) {
      throw new Error(`Failed to update task: ${updateError.message}`)
    }

    // Trigger transcription and analytics
    const transcriptionResult = await triggerCallTranscription(taskId, callId, callData, task)

    console.log('✅ Recording upload processed for task:', taskId)

    return {
      task_updated: true,
      call_id: callId,
      status: 'recording_uploaded',
      transcription_triggered: true,
      transcription_id: transcriptionResult?.transcription_id,
      analytics_id: transcriptionResult?.analytics_id
    }

  } catch (error) {
    console.error('❌ Error handling recording upload:', error)
    throw error
  }
}

async function triggerCallTranscription(
  taskId: string, 
  callId: string, 
  callData: any, 
  task: any
): Promise<any> {
  console.log('🎙️ Triggering call transcription for task:', taskId)
  
  try {
    // Prepare call analytics data
    const callAnalyticsData = {
      call_id: callId,
      task_id: taskId,
      lead_id: task.lead_id || task.metadata?.lead_id,
      client_name: task.client_name || task.metadata?.client_name || 'Unknown Client',
      sales_agent: task.assigned_to || 'Vikas Alagarsamy',
      phone_number: callData.phone_number || task.metadata?.phone_number || 'Unknown',
      recording_url: callData.recording_url,
      duration: callData.duration || task.metadata?.call_duration || 0
    }

    // Use call analytics service for transcription and analysis
    const transcription = await callAnalyticsService.transcribeCall(callAnalyticsData)

    // Update task with transcription reference
    await supabase
      .from('ai_tasks')
      .update({
        metadata: {
          ...task.metadata,
          transcription_id: transcription.id,
          transcription_completed: true,
          analytics_available: true
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    console.log('✅ Call transcription completed for task:', taskId)

    return {
      transcription_id: transcription.id,
      call_id: callId,
      analytics_generated: true
    }

  } catch (error) {
    console.error('❌ Error triggering call transcription:', error)
    
    // Update task with error status
    await supabase
      .from('ai_tasks')
      .update({
        metadata: {
          ...task.metadata,
          transcription_error: error.toString(),
          transcription_attempted: true
        }
      })
      .eq('id', taskId)
    
    throw error
  }
}

// GET endpoint for integration status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')

  if (!taskId) {
    return NextResponse.json({ 
      error: 'Task ID is required' 
    }, { status: 400 })
  }

  try {
    // Get task with call integration status
    const { data: task, error } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error || !task) {
      return NextResponse.json({ 
        error: 'Task not found' 
      }, { status: 404 })
    }

    const callIntegrationStatus = {
      task_id: taskId,
      call_started: task.metadata?.call_started || false,
      call_completed: task.metadata?.call_completed || false,
      recording_available: task.metadata?.recording_available || false,
      transcription_completed: task.metadata?.transcription_completed || false,
      analytics_available: task.metadata?.analytics_available || false,
      call_id: task.metadata?.call_id,
      transcription_id: task.metadata?.transcription_id,
      call_duration: task.metadata?.call_duration,
      call_outcome: task.metadata?.call_outcome
    }

    return NextResponse.json(callIntegrationStatus)

  } catch (error) {
    console.error('❌ Error getting call integration status:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 