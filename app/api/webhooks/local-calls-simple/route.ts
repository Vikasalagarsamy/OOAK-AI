import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { v4 as uuidv4 } from 'uuid'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  console.log('🐘 Simple local call webhook triggered (PostgreSQL)')
  
  try {
    const data = await request.json()
    console.log('📝 Received data:', data)
    
    if (data.type === 'manual_transcript') {
      return await handleManualTranscriptSimple(data)
    }
    
    return NextResponse.json(
      { error: 'Unsupported type. Use manual_transcript for testing.' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('❌ Simple webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Simple webhook failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

async function handleManualTranscriptSimple(data: any): Promise<NextResponse> {
  const client = await pool.connect()
  
  try {
    const {
      call_id = uuidv4(),
      client_name,
      sales_agent,
      phone_number,
      transcript,
      duration = 300
    } = data
    
    // Validate required fields
    if (!client_name || !sales_agent || !phone_number || !transcript) {
      return NextResponse.json(
        { error: 'Missing required fields for manual transcript' },
        { status: 400 }
      )
    }
    
    console.log('📝 Processing manual transcript:', call_id)
    
    // Begin transaction
    await client.query('BEGIN')
    
    // Step 1: Insert transcription record
    console.log('📝 Inserting transcription record...')
    
    let insertQuery = `
      INSERT INTO call_transcriptions (
        call_id, client_name, sales_agent, phone_number, 
        duration, transcript, confidence_score, language
        ${data.task_id && data.task_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? ', task_id' : ''}
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
        ${data.task_id && data.task_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? ', $9' : ''}
      ) RETURNING *
    `
    
    let insertParams: any[] = [
      call_id,
      client_name,
      sales_agent,
      phone_number,
      duration,
      transcript,
      1.0,
      'en'
    ]
    
    if (data.task_id && data.task_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      insertParams.push(data.task_id)
    }
    
    console.log('📝 Insert data:', { call_id, client_name, sales_agent, phone_number })
    
    const transcriptionResult = await client.query(insertQuery, insertParams)
    const transcriptionRecord = transcriptionResult.rows[0]
    
    console.log('✅ Transcription record created:', transcriptionRecord.id)
    
    // Step 2: Simple analytics (without AI for now)
    console.log('📊 Creating simple analytics...')
    
    const analyticsQuery = `
      INSERT INTO call_analytics (
        call_id, overall_sentiment, sentiment_score, client_sentiment, agent_sentiment,
        call_intent, key_topics, business_outcomes, action_items,
        agent_professionalism_score, agent_responsiveness_score, agent_knowledge_score, agent_closing_effectiveness,
        client_engagement_level, client_interest_level, client_objection_handling, client_buying_signals,
        forbidden_words_detected, compliance_issues, risk_level, talk_time_ratio, interruptions, silent_periods,
        call_quality_score, quote_discussed, budget_mentioned, timeline_discussed, next_steps_agreed, follow_up_required,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
      ) RETURNING *
    `
    
    const analyticsResult = await client.query(analyticsQuery, [
      call_id,
      'positive',
      0.5,
      'positive',
      'positive',
      'wedding_inquiry',
      JSON.stringify(['wedding', 'photography', 'packages']),
      JSON.stringify(['quote_requested']),
      JSON.stringify(['send_proposal']),
      8,
      8,
      8,
      7,
      'high',
      'high',
      JSON.stringify([]),
      JSON.stringify(['asked_for_proposal']),
      JSON.stringify([]),
      JSON.stringify([]),
      'low',
      1.2,
      0,
      0,
      8.5,
      true,
      false,
      true,
      true,
      true,
      new Date().toISOString()
    ])
    
    const analyticsRecord = analyticsResult.rows[0]
    console.log('✅ Analytics record created:', analyticsRecord.id)
    
    // Commit transaction
    await client.query('COMMIT')
    
    return NextResponse.json({
      success: true,
      message: 'Simple manual transcript processed successfully',
      data: {
        call_id,
        transcription_id: transcriptionRecord.id,
        analytics_id: analyticsRecord.id,
        processing_type: 'simple_local_processing'
      },
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('❌ Simple manual transcript processing error:', error)
    return NextResponse.json(
      { 
        error: 'Simple manual transcript processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: error?.code,
        hint: error?.hint
      },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Simple Local Call Analytics Webhook - PostgreSQL VERSION',
    version: '2.0.0',
    features: [
      'Manual Transcript Processing',
      'Simple Analytics Generation',
      'PostgreSQL Direct Connection',
      'Transaction Safety',
      'Basic Error Handling'
    ],
    endpoints: {
      manual_transcript: 'POST with JSON {type: "manual_transcript"}'
    },
    metadata: {
      database: "PostgreSQL localhost:5432",
      timestamp: new Date().toISOString()
    }
  })
} 