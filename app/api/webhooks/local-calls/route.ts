import { NextRequest, NextResponse } from 'next/server'
import { localCallAnalyticsService } from '@/services/local-call-analytics-service'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  console.log('🔄 Local call webhook triggered')
  
  try {
    const contentType = request.headers.get('content-type')
    
    // Handle multipart form data (file upload)
    if (contentType?.includes('multipart/form-data')) {
      return await handleFileUpload(request)
    }
    
    // Handle JSON data (pre-transcribed or metadata)
    if (contentType?.includes('application/json')) {
      return await handleJSONData(request)
    }
    
    return NextResponse.json(
      { error: 'Unsupported content type. Use multipart/form-data for file uploads or application/json for pre-transcribed calls.' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('❌ Local call webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ==========================
// FILE UPLOAD HANDLER
// ==========================

async function handleFileUpload(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    
    // Extract file and metadata
    const audioFile = formData.get('audio_file') as File
    const callId = formData.get('call_id') as string || uuidv4()
    const taskId = formData.get('task_id') as string
    const leadId = formData.get('lead_id') as string
    const clientName = formData.get('client_name') as string
    const salesAgent = formData.get('sales_agent') as string
    const phoneNumber = formData.get('phone_number') as string
    const duration = formData.get('duration') as string
    
    // Validate required fields
    if (!audioFile || !clientName || !salesAgent || !phoneNumber) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['audio_file', 'client_name', 'sales_agent', 'phone_number'],
          received: {
            audio_file: !!audioFile,
            client_name: !!clientName,
            sales_agent: !!salesAgent,
            phone_number: !!phoneNumber
          }
        },
        { status: 400 }
      )
    }
    
    console.log('📁 Processing file upload:', {
      filename: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      call_id: callId,
      client: clientName,
      agent: salesAgent
    })
    
    // Convert file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    
    // Process with local analytics
    const transcription = await localCallAnalyticsService.transcribeCallFromUpload({
      call_id: callId,
      task_id: taskId || undefined,
      lead_id: leadId ? parseInt(leadId) : undefined,
      client_name: clientName,
      sales_agent: salesAgent,
      phone_number: phoneNumber,
      audio_file: audioBuffer,
      original_filename: audioFile.name,
      duration: duration ? parseFloat(duration) : undefined
    })
    
    return NextResponse.json({
      success: true,
      message: 'LOCAL call processing completed successfully',
      data: {
        call_id: callId,
        transcription_id: transcription.id,
        client_name: clientName,
        sales_agent: salesAgent,
        processing_type: 'local_whisper_ollama',
        transcript_preview: transcription.transcript.substring(0, 200) + '...',
        confidence_score: transcription.confidence_score,
        duration: transcription.duration,
        local_file_path: transcription.recording_url
      },
      webhook_type: 'local_call_upload',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ File upload processing error:', error)
    return NextResponse.json(
      { 
        error: 'File upload processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        processing_type: 'local_upload'
      },
      { status: 500 }
    )
  }
}

// ==========================
// JSON DATA HANDLER
// ==========================

async function handleJSONData(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json()
    
    // Handle pre-transcribed calls
    if (data.type === 'pre_transcribed') {
      return await handlePreTranscribedCall(data)
    }
    
    // Handle call status updates
    if (data.type === 'call_status') {
      return await handleCallStatusUpdate(data)
    }
    
    // Handle manual transcript input
    if (data.type === 'manual_transcript') {
      return await handleManualTranscript(data)
    }
    
    return NextResponse.json(
      { error: 'Unknown JSON data type. Supported types: pre_transcribed, call_status, manual_transcript' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('❌ JSON data processing error:', error)
    return NextResponse.json(
      { error: 'JSON data processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ==========================
// PRE-TRANSCRIBED CALLS
// ==========================

async function handlePreTranscribedCall(data: any): Promise<NextResponse> {
  try {
    const {
      call_id = uuidv4(),
      task_id,
      lead_id,
      client_name,
      sales_agent,
      phone_number,
      transcript,
      duration,
      confidence_score = 0.8
    } = data
    
    // Validate required fields
    if (!client_name || !sales_agent || !phone_number || !transcript) {
      return NextResponse.json(
        { error: 'Missing required fields for pre-transcribed call' },
        { status: 400 }
      )
    }
    
    console.log('📝 Processing pre-transcribed call:', call_id)
    
    // Create transcription record directly
    const { createClient } = await import('@/utils/supabase/server')
    const { query, transaction } = createClient()
    
    const { data: transcriptionRecord, error } = await supabase
      .from('call_transcriptions')
      .insert({
        call_id,
        task_id,
        lead_id,
        client_name,
        sales_agent,
        phone_number,
        duration: duration || 300,
        transcript,
        confidence_score,
        language: 'en',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Trigger analytics
    await localCallAnalyticsService.analyzeCall(transcriptionRecord)
    
    return NextResponse.json({
      success: true,
      message: 'Pre-transcribed call processed successfully',
      data: {
        call_id,
        transcription_id: transcriptionRecord.id,
        processing_type: 'pre_transcribed_local_analysis'
      }
    })
    
  } catch (error) {
    console.error('❌ Pre-transcribed call processing error:', error)
    return NextResponse.json(
      { error: 'Pre-transcribed call processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ==========================
// MANUAL TRANSCRIPT INPUT
// ==========================

async function handleManualTranscript(data: any): Promise<NextResponse> {
  try {
    const {
      call_id = uuidv4(),
      task_id,
      client_name,
      sales_agent,
      phone_number,
      transcript,
      duration = 300
    } = data
    
    console.log('✍️ Processing manual transcript input:', call_id)
    
    // Similar to pre-transcribed but with different metadata
    const { createClient } = await import('@/utils/supabase/server')
    const { query, transaction } = createClient()
    
    const { data: transcriptionRecord, error } = await supabase
      .from('call_transcriptions')
      .insert({
        call_id,
        task_id,
        client_name,
        sales_agent,
        phone_number,
        duration,
        transcript,
        confidence_score: 1.0, // Manual input is 100% accurate
        language: 'en',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Trigger analytics
    await localCallAnalyticsService.analyzeCall(transcriptionRecord)
    
    return NextResponse.json({
      success: true,
      message: 'Manual transcript processed successfully',
      data: {
        call_id,
        transcription_id: transcriptionRecord.id,
        processing_type: 'manual_input_local_analysis'
      }
    })
    
  } catch (error) {
    console.error('❌ Manual transcript processing error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Manual transcript processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        errorString: String(error)
      },
      { status: 500 }
    )
  }
}

// ==========================
// CALL STATUS UPDATES
// ==========================

async function handleCallStatusUpdate(data: any): Promise<NextResponse> {
  try {
    const { task_id, status, call_id, duration } = data
    
    if (!task_id || !status) {
      return NextResponse.json(
        { error: 'Missing task_id or status for call status update' },
        { status: 400 }
      )
    }
    
    console.log('📞 Updating call status:', { task_id, status, call_id })
    
    const { createClient } = await import('@/utils/supabase/server')
    const { query, transaction } = createClient()
    
    // Update task with call status
    const { error } = await supabase
      .from('ai_tasks')
      .update({
        status: status === 'completed' ? 'completed' : 'in_progress',
        metadata: {
          call_id,
          call_status: status,
          call_duration: duration,
          local_processing: true,
          last_updated: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', task_id)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: 'Call status updated successfully',
      data: { task_id, status, call_id }
    })
    
  } catch (error) {
    console.error('❌ Call status update error:', error)
    return NextResponse.json(
      { error: 'Call status update failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ==========================
// GET ENDPOINT (STATUS CHECK)
// ==========================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const callId = searchParams.get('call_id')
  
  try {
    if (callId) {
      const { createClient } = await import('@/utils/supabase/server')
      const { query, transaction } = createClient()
      
      const { data: transcription } = await supabase
        .from('call_transcriptions')
        .select('*')
        .eq('call_id', callId)
        .single()
      
      const { data: analytics } = await supabase
        .from('call_analytics')
        .select('*')
        .eq('call_id', callId)
        .single()
      
      return NextResponse.json({
        success: true,
        data: {
          transcription,
          analytics,
          processing_type: 'local_free_solution'
        }
      })
    }
    
    // Get storage stats
    const storageStats = await localCallAnalyticsService.getStorageStats()
    
    return NextResponse.json({
      success: true,
      message: 'LOCAL Call Analytics Webhook - FREE SOLUTION',
      version: '2.0.0',
      features: [
        'Local Whisper Transcription (FREE)',
        'Local Ollama Analysis (FREE)',
        'File Upload Support',
        'Pre-transcribed Call Processing',
        'Manual Transcript Input',
        'Complete Call Analytics',
        'Zero API Costs'
      ],
      storage_stats: storageStats,
      endpoints: {
        file_upload: 'POST with multipart/form-data',
        pre_transcribed: 'POST with JSON {type: "pre_transcribed"}',
        manual_transcript: 'POST with JSON {type: "manual_transcript"}',
        call_status: 'POST with JSON {type: "call_status"}'
      },
      requirements: {
        whisper: 'pip install openai-whisper',
        ollama: 'Local Ollama running on localhost:11434',
        models: 'llama3.1:8b (or any compatible model)'
      }
    })
    
  } catch (error) {
    console.error('❌ Status check error:', error)
    return NextResponse.json(
      { error: 'Status check failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 