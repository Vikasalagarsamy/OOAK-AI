import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/postgresql-client';

export async function GET(request: NextRequest) {
  try {
    console.log('📞 [CALL TRANSCRIPTIONS] Fetching transcriptions via PostgreSQL...')
    
    // Fetch call transcriptions
    const result = await query(`
      SELECT *
      FROM call_transcriptions
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const transcriptions = result.rows.map(transcription => ({
      ...transcription,
      // Parse JSON fields if they're stored as strings
      transcript_data: typeof transcription.transcript_data === 'string' 
        ? JSON.parse(transcription.transcript_data) 
        : transcription.transcript_data,
      speaker_labels: typeof transcription.speaker_labels === 'string' 
        ? JSON.parse(transcription.speaker_labels) 
        : transcription.speaker_labels
    }));

    console.log(`✅ [CALL TRANSCRIPTIONS] Fetched ${transcriptions.length} transcriptions via PostgreSQL`)

    return NextResponse.json(transcriptions);

  } catch (error) {
    console.error('❌ Call transcriptions API error (PostgreSQL):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 