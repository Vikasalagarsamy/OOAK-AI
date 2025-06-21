import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'
import { UniversalBusinessIntelligenceService } from '@/services/universal-business-intelligence-service'
import { callAnalyticsService } from '@/services/call-analytics-service'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

const universalBI = new UniversalBusinessIntelligenceService()

// Enhanced call recording webhook endpoint with analytics - PostgreSQL Migration
export async function POST(request: NextRequest) {
  console.log('📞 Enhanced call recording webhook received (PostgreSQL)')
  
  let client
  try {
    client = await pool.connect()
    
    const body = await request.json()
    console.log('📥 Call webhook data:', JSON.stringify(body, null, 2))

    let processResult: any = null

    // Handle different call recording service formats with enhanced analytics
    if (body.recording_url) {
      // Direct recording URL provided
      processResult = await processCallRecordingWithAnalytics(client, body)
    } else if (body.call_data) {
      // Structured call data
      processResult = await processCallDataWithAnalytics(client, body.call_data)
    } else if (body.transcript) {
      // Pre-transcribed call
      processResult = await processCallTranscriptWithAnalytics(client, body)
    } else if (body.audio_file) {
      // Audio file upload
      processResult = await processAudioFileWithAnalytics(client, body)
    } else {
      throw new Error('No valid call data provided')
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Call recording processed with analytics successfully',
      analytics_generated: processResult?.analytics_generated || false,
      transcription_id: processResult?.transcription_id,
      analytics_id: processResult?.analytics_id,
      
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Enhanced call recording webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      
    }, { status: 500 })
  } finally {
    if (client) {
      client.release()
    }
  }
}

async function processCallRecordingWithAnalytics(client: any, callData: any) {
  console.log('🎙️ Processing call recording with analytics (PostgreSQL):', callData.recording_url)

  try {
    await client.query('BEGIN')

    // Enhanced processing with call analytics
    const callAnalyticsData = {
      call_id: callData.call_id || `call_${Date.now()}`,
      task_id: callData.task_id,
      lead_id: callData.lead_id,
      client_name: callData.client_name || callData.caller_name || 'Unknown Client',
      sales_agent: callData.sales_agent || callData.agent_name || 'Vikas Alagarsamy',
      phone_number: callData.from || callData.caller_number || 'Unknown',
      recording_url: callData.recording_url,
      duration: callData.duration || 0
    }

    // Store call transcription record in PostgreSQL
    const insertCallQuery = `
      INSERT INTO call_transcriptions (
        call_id, task_id, lead_id, client_name, sales_agent, 
        phone_number, recording_url, duration, status, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, call_id
    `
    
    const callResult = await client.query(insertCallQuery, [
      callAnalyticsData.call_id,
      callAnalyticsData.task_id,
      callAnalyticsData.lead_id,
      callAnalyticsData.client_name,
      callAnalyticsData.sales_agent,
      callAnalyticsData.phone_number,
      callAnalyticsData.recording_url,
      callAnalyticsData.duration,
      'processing'
    ])

    const transcriptionId = callResult.rows[0].id

    // Generate transcript using call analytics service
    let transcript = ''
    let analytics_generated = false
    
    try {
      const transcription = await callAnalyticsService.transcribeCall(callAnalyticsData)
      transcript = transcription.transcript || ''
      analytics_generated = true
      
      // Update transcript in database
      await client.query(
        'UPDATE call_transcriptions SET transcript = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [transcript, 'completed', transcriptionId]
      )
      
    } catch (transcriptError) {
      console.log('⚠️ Transcription failed, using placeholder:', transcriptError)
      transcript = `[Transcript for recording: ${callData.recording_url}] - Transcription service integration needed`
      
      await client.query(
        'UPDATE call_transcriptions SET transcript = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [transcript, 'error', transcriptionId]
      )
    }

    // Record communication analytics in PostgreSQL
    const communicationQuery = `
      INSERT INTO communications (
        channel_type, message_id, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type, content_text,
        content_metadata, business_context, ai_processed, ai_priority_score,
        sent_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING id
    `
    
    const isFromClient = !isBusinessNumber(callData.from || callData.caller_number)
    const communicationResult = await client.query(communicationQuery, [
      'call',
      callAnalyticsData.call_id,
      isFromClient ? 'client' : 'employee',
      callData.from || callData.caller_number,
      callAnalyticsData.client_name,
      'employee',
      'business',
      'Business',
      'audio',
      transcript,
      JSON.stringify({
        duration: callData.duration || 0,
        recording_url: callData.recording_url,
        call_type: 'voice'
      }),
      'phone_call',
      analytics_generated,
      0.8,
      callData.timestamp || new Date().toISOString()
    ])

    await client.query('COMMIT')
    
    console.log('✅ Call recording processed with PostgreSQL analytics:', transcriptionId)
    
    return {
      analytics_generated,
      transcription_id: transcriptionId,
      communication_id: communicationResult.rows[0].id
    }

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error processing call recording with analytics:', error)
    throw error
  }
}

async function processCallDataWithAnalytics(client: any, callData: any) {
  console.log('📊 Processing structured call data with analytics (PostgreSQL)')

  try {
    await client.query('BEGIN')

    // Enhanced processing with call analytics
    const callAnalyticsData = {
      call_id: callData.call_id || `call_${Date.now()}`,
      task_id: callData.task_id,
      lead_id: callData.lead_id,
      client_name: callData.caller_name || 'Unknown Client',
      sales_agent: callData.agent_name || 'Vikas Alagarsamy',
      phone_number: callData.from || 'Unknown',
      recording_url: callData.recording_url,
      duration: callData.duration || 0
    }

    // Use call analytics service if recording URL is available
    if (callData.recording_url) {
      // Store in call_transcriptions table
      const insertQuery = `
        INSERT INTO call_transcriptions (
          call_id, task_id, lead_id, client_name, sales_agent,
          phone_number, recording_url, duration, status,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id
      `
      
      const result = await client.query(insertQuery, [
        callAnalyticsData.call_id,
        callAnalyticsData.task_id,
        callAnalyticsData.lead_id,
        callAnalyticsData.client_name,
        callAnalyticsData.sales_agent,
        callAnalyticsData.phone_number,
        callAnalyticsData.recording_url,
        callAnalyticsData.duration,
        'processing'
      ])

      const transcriptionId = result.rows[0].id

      try {
        const transcription = await callAnalyticsService.transcribeCall(callAnalyticsData)
        
        // Update with transcript
        await client.query(
          'UPDATE call_transcriptions SET transcript = $1, status = $2, updated_at = NOW() WHERE id = $3',
          [transcription.transcript, 'completed', transcriptionId]
        )

        await client.query('COMMIT')
        
        return {
          analytics_generated: true,
          transcription_id: transcriptionId
        }
      } catch (transcriptError) {
        console.log('⚠️ Transcription failed:', transcriptError)
        
        await client.query(
          'UPDATE call_transcriptions SET status = $1, updated_at = NOW() WHERE id = $2',
          ['error', transcriptionId]
        )

        await client.query('COMMIT')
        
        return {
          analytics_generated: false,
          transcription_id: transcriptionId
        }
      }
    } else {
      // Fallback to standard communication processing
      const communicationQuery = `
        INSERT INTO communications (
          channel_type, message_id, sender_type, sender_id, sender_name,
          recipient_type, recipient_id, recipient_name, content_type, content_text,
          content_metadata, business_context, ai_processed, ai_priority_score,
          sent_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING id
      `
      
      const isFromClient = !isBusinessNumber(callData.from)
      const communicationResult = await client.query(communicationQuery, [
        'call',
        callData.call_id || `call_${Date.now()}`,
        isFromClient ? 'client' : 'employee',
        callData.from,
        callData.caller_name,
        'employee',
        callData.to,
        callData.recipient_name,
        'audio',
        callData.summary || 'Call recording available',
        JSON.stringify({
          duration: callData.duration,
          call_type: callData.call_type || 'voice',
          recording_url: callData.recording_url,
          call_quality: callData.quality,
          call_outcome: callData.outcome
        }),
        callData.business_context || 'phone_call',
        false,
        0.6,
        callData.timestamp || new Date().toISOString()
      ])

      await client.query('COMMIT')

      return {
        analytics_generated: false,
        communication_id: communicationResult.rows[0].id
      }
    }

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error processing structured call data with analytics:', error)
    throw error
  }
}

async function processCallTranscriptWithAnalytics(client: any, transcriptData: any) {
  console.log('📝 Processing pre-transcribed call with analytics (PostgreSQL)')

  try {
    await client.query('BEGIN')

    // Enhanced processing with call analytics for pre-transcribed calls
    const callAnalyticsData = {
      call_id: transcriptData.call_id || `call_${Date.now()}`,
      task_id: transcriptData.task_id,
      lead_id: transcriptData.lead_id,
      client_name: transcriptData.client_name || 'Unknown Client',
      sales_agent: transcriptData.sales_agent || 'Vikas Alagarsamy',
      phone_number: transcriptData.from || 'Unknown',
      duration: transcriptData.duration || 0
    }

    // Store call transcription in PostgreSQL
    const insertCallQuery = `
      INSERT INTO call_transcriptions (
        call_id, task_id, lead_id, client_name, sales_agent,
        phone_number, transcript, duration, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id
    `
    
    const callResult = await client.query(insertCallQuery, [
      callAnalyticsData.call_id,
      callAnalyticsData.task_id,
      callAnalyticsData.lead_id,
      callAnalyticsData.client_name,
      callAnalyticsData.sales_agent,
      callAnalyticsData.phone_number,
      transcriptData.transcript,
      callAnalyticsData.duration,
      'completed'
    ])

    const transcriptionId = callResult.rows[0].id

    // Store communication record
    const communicationQuery = `
      INSERT INTO communications (
        channel_type, message_id, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type, content_text,
        content_metadata, business_context, ai_processed, ai_priority_score,
        sent_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING id
    `
    
    const isFromClient = !isBusinessNumber(transcriptData.from)
    const communicationResult = await client.query(communicationQuery, [
      'call',
      transcriptData.call_id || `call_${Date.now()}`,
      isFromClient ? 'client' : 'employee',
      transcriptData.from,
      transcriptData.client_name,
      'employee',
      transcriptData.to,
      'Business',
      'audio',
      transcriptData.transcript,
      JSON.stringify({
        duration: transcriptData.duration || 0,
        call_type: 'voice'
      }),
      'phone_call',
      true,
      0.7,
      transcriptData.timestamp || new Date().toISOString()
    ])

    await client.query('COMMIT')

    console.log('✅ Pre-transcribed call processed with PostgreSQL analytics:', transcriptionId)

    return {
      analytics_generated: true,
      transcription_id: transcriptionId,
      communication_id: communicationResult.rows[0].id
    }

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error processing call transcript with analytics:', error)
    throw error
  }
}

async function processAudioFileWithAnalytics(client: any, audioData: any) {
  console.log('🎵 Processing audio file with analytics (PostgreSQL)')

  try {
    await client.query('BEGIN')

    // Process audio file upload
    const callAnalyticsData = {
      call_id: `audio_${Date.now()}`,
      client_name: audioData.client_name || 'Unknown Client',
      sales_agent: audioData.sales_agent || 'Vikas Alagarsamy',
      phone_number: audioData.phone_number || 'Unknown',
      duration: audioData.duration || 0
    }

    // Store audio upload record
    const insertQuery = `
      INSERT INTO call_transcriptions (
        call_id, client_name, sales_agent, phone_number, 
        duration, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `
    
    const result = await client.query(insertQuery, [
      callAnalyticsData.call_id,
      callAnalyticsData.client_name,
      callAnalyticsData.sales_agent,
      callAnalyticsData.phone_number,
      callAnalyticsData.duration,
      'processing'
    ])

    const transcriptionId = result.rows[0].id

    // Try to process with call analytics service
    if (audioData.audio_file) {
      try {
        const transcription = await callAnalyticsService.transcribeCall({
          ...callAnalyticsData,
          audio_file: audioData.audio_file
        })

        // Update with results
        await client.query(
          'UPDATE call_transcriptions SET transcript = $1, status = $2, updated_at = NOW() WHERE id = $3',
          [transcription.transcript, 'completed', transcriptionId]
        )

        await client.query('COMMIT')

        return {
          analytics_generated: true,
          transcription_id: transcriptionId
        }
      } catch (transcriptError) {
        console.log('⚠️ Audio transcription failed:', transcriptError)
        
        await client.query(
          'UPDATE call_transcriptions SET status = $1, updated_at = NOW() WHERE id = $2',
          ['error', transcriptionId]
        )
      }
    }

    // Fallback to communication record
    const communicationQuery = `
      INSERT INTO communications (
        channel_type, message_id, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type, content_text,
        content_metadata, business_context, ai_processed, ai_priority_score,
        sent_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING id
    `
    
    const communicationResult = await client.query(communicationQuery, [
      'call',
      `audio_${Date.now()}`,
      'client',
      audioData.sender_id || 'unknown',
      audioData.sender_name,
      'employee',
      audioData.recipient_id || 'business',
      'Business',
      'audio',
      'Audio file uploaded - transcription pending',
      JSON.stringify({
        file_name: audioData.file_name,
        file_size: audioData.file_size,
        file_type: audioData.file_type,
        upload_method: 'webhook'
      }),
      'audio_upload',
      false,
      0.5,
      new Date().toISOString()
    ])

    await client.query('COMMIT')

    return {
      analytics_generated: false,
      transcription_id: transcriptionId,
      communication_id: communicationResult.rows[0].id
    }

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error processing audio file with analytics:', error)
    throw error
  }
}

function isBusinessNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false
  
  // Business phone numbers to identify internal calls
  const businessNumbers = [
    '+919677362524',
    '919677362524',
    '+911234567890', // Add your business numbers here
    '1234567890'
  ]
  
  return businessNumbers.includes(phoneNumber.replace(/\s+/g, ''))
}

// Handle GET requests for webhook information - PostgreSQL Migration
export async function GET() {
  let client
  try {
    client = await pool.connect()
    
    // Get database statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_calls,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_calls
      FROM call_transcriptions
    `
    
    const statsResult = await client.query(statsQuery)
    const stats = statsResult.rows[0]

    return NextResponse.json({
      message: 'Call Recording Webhook Endpoint (PostgreSQL)',
      description: 'Processes call recordings and generates transcripts with AI analysis using PostgreSQL',
      
      statistics: {
        total_calls: parseInt(stats.total_calls) || 0,
        completed_calls: parseInt(stats.completed_calls) || 0,
        processing_calls: parseInt(stats.processing_calls) || 0,
        error_calls: parseInt(stats.error_calls) || 0
      },
      supported_formats: [
        {
          name: 'Recording URL',
          description: 'Provide recording_url and call metadata',
          example: {
            recording_url: 'https://example.com/recording.mp3',
            call_id: 'call_123',
            from: '+1234567890',
            to: '+0987654321',
            duration: 300,
            timestamp: '2024-01-01T10:00:00Z'
          }
        },
        {
          name: 'Structured Call Data',
          description: 'Provide call_data object with full metadata',
          example: {
            call_data: {
              call_id: 'call_123',
              from: '+1234567890',
              to: '+0987654321',
              caller_name: 'John Doe',
              duration: 300,
              call_type: 'inbound',
              recording_url: 'https://example.com/recording.mp3'
            }
          }
        },
        {
          name: 'Pre-transcribed Call',
          description: 'Provide transcript directly',
          example: {
            call_id: 'call_123',
            from: '+1234567890', 
            to: '+0987654321',
            transcript: 'Hello, I would like to inquire about...',
            duration: 300
          }
        },
        {
          name: 'Audio File Upload',
          description: 'Provide audio file for processing',
          example: {
            audio_file: 'base64_encoded_audio_data',
            client_name: 'John Doe',
            phone_number: '+1234567890'
          }
        }
      ],
      ai_features: [
        'Automatic transcript generation',
        'Sentiment analysis',
        'Key topic extraction', 
        'Action item identification',
        'Integration with business context',
        'PostgreSQL transaction safety'
      ]
    })

  } catch (error) {
    console.error('❌ Error getting webhook info:', error)
    return NextResponse.json({
      message: 'Call Recording Webhook Endpoint (PostgreSQL)',
      description: 'Processes call recordings with PostgreSQL backend',
      
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    if (client) {
      client.release()
    }
  }
}