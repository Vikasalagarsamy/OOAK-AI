import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { query, transaction } = createClient()
    
    console.log('🧪 Testing simple database insert...')
    console.log('Input data:', data)
    
    const call_id = uuidv4()
    
    // Test simple insert into call_transcriptions
    const { data: transcriptionRecord, error } = await supabase
      .from('call_transcriptions')
      .insert({
        call_id,
        client_name: data.client_name,
        sales_agent: data.sales_agent,
        phone_number: data.phone_number,
        duration: data.duration || 60,
        transcript: data.transcript,
        confidence_score: 1.0,
        language: 'en',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Database insert error:', error)
      throw error
    }
    
    console.log('✅ Database insert successful:', transcriptionRecord)
    
    return NextResponse.json({
      success: true,
      message: 'Simple database insert successful',
      data: {
        call_id,
        transcription_id: transcriptionRecord.id,
        test_type: 'simple_insert'
      }
    })
    
  } catch (error) {
    console.error('❌ Simple insert test error:', error)
    return NextResponse.json(
      { 
        error: 'Simple insert test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        hint: (error as any)?.hint
      },
      { status: 500 }
    )
  }
} 