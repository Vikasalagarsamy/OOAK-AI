import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  console.log('🐘 Simple file upload webhook triggered (PostgreSQL)')
  
  try {
    const contentType = request.headers.get('content-type')
    
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data for file upload' },
        { status: 400 }
      )
    }
    
    const formData = await request.formData()
    
    // Extract file and metadata
    const audioFile = formData.get('audio_file') as File
    const callId = (formData.get('call_id') as string) || uuidv4()
    const taskId = formData.get('task_id') as string | null
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
    
    // Save the audio file
    const uploadsDir = path.join(process.cwd(), 'uploads', 'call-recordings')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    const filename = `${callId}_${Date.now()}_${audioFile.name}`
    const filepath = path.join(uploadsDir, filename)
    
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    fs.writeFileSync(filepath, audioBuffer)
    
    console.log('📁 Audio file saved:', filepath)
    
    // Create a placeholder transcript for now
    const placeholderTranscript = `[Audio file uploaded: ${audioFile.name}]
Client: ${clientName}
Agent: ${salesAgent}
Phone: ${phoneNumber}
Duration: ${duration || 'Unknown'} seconds

[To enable automatic transcription, Whisper processing will be implemented next]`
    
    // Store in database using PostgreSQL
    const client = await pool.connect()
    
    try {
      const insertQuery = `
        INSERT INTO call_transcriptions (
          call_id, task_id, client_name, sales_agent, phone_number, 
          duration, recording_url, transcript, confidence_score, language, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *
      `
      
      const result = await client.query(insertQuery, [
        callId,
        taskId || null,
        clientName,
        salesAgent,
        phoneNumber,
        duration ? parseInt(duration) : 300,
        filepath,
        placeholderTranscript,
        1.0, // Placeholder confidence score
        'en',
        new Date().toISOString()
      ])
      
      const transcriptionRecord = result.rows[0]
      console.log('✅ File upload and PostgreSQL insert successful')
      
      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully (Whisper processing will be added next)',
        data: {
          call_id: callId,
          transcription_id: transcriptionRecord.id,
          client_name: clientName,
          sales_agent: salesAgent,
          processing_type: 'file_upload_placeholder',
          transcript_preview: placeholderTranscript.substring(0, 200) + '...',
          confidence_score: 1.0,
          duration: duration ? parseInt(duration) : 300,
          local_file_path: filepath,
          file_info: {
            name: audioFile.name,
            size: audioFile.size,
            type: audioFile.type
          }
        },
        webhook_type: 'simple_file_upload',
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error: any) {
    console.error('❌ Simple file upload error:', error)
    return NextResponse.json(
      { 
        error: 'File upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        processing_type: 'simple_upload'
      },
      { status: 500 }
    )
  }
} 