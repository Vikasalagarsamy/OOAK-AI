import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { LocalCallAnalyticsService } from '@/services/local-call-analytics-service'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

const localCallAnalyticsService = new LocalCallAnalyticsService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { call_id, transcript, confidence_score, duration } = body

    if (!call_id || !transcript) {
      return NextResponse.json(
        { error: 'Missing call_id or transcript' },
        { status: 400 }
      )
    }

    console.log(`🐘 Updating transcript for call_id: ${call_id} (PostgreSQL)`)

    const client = await pool.connect()

    try {
      // Update the transcript
      const updateQuery = `
        UPDATE call_transcriptions 
        SET 
          transcript = $1,
          confidence_score = $2,
          duration = $3,
          updated_at = $4
        WHERE call_id = $5
        RETURNING *
      `

      const result = await client.query(updateQuery, [
        transcript,
        confidence_score || 0.8,
        duration || 300,
        new Date().toISOString(),
        call_id
      ])

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: `No call found with call_id: ${call_id}` },
          { status: 404 }
        )
      }

      const updatedTranscript = result.rows[0]
      console.log('✅ Transcript updated successfully in PostgreSQL')

      // Now trigger analytics for the updated transcript
      await localCallAnalyticsService.analyzeCall(updatedTranscript as any)

      return NextResponse.json({
        success: true,
        message: 'Transcript updated and analyzed successfully',
        data: {
          call_id,
          transcription_id: updatedTranscript.id,
          analytics_generated: true
        },
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('❌ Update transcript error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update transcript', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 