import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/postgresql-client';
import { AdvancedSpeakerDiarizationService } from '@/services/advanced-speaker-diarization-service';

// GET: Retrieve call for manual correction
export async function GET(request: NextRequest) {
  try {
    console.log('🎤 [SPEAKER CORRECTION] Retrieving call for correction via PostgreSQL...')
    
    const url = new URL(request.url);
    const callId = url.searchParams.get('callId');

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    // Get the call transcript
    const callResult = await query(`
      SELECT *
      FROM call_transcriptions
      WHERE id = $1
    `, [callId])

    if (callResult.rows.length === 0) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const call = callResult.rows[0]

    // Check if there's a corrected version in the call record itself
    let transcriptToUse = call.transcript;
    
    // Check if call has been manually corrected (confidence_score = 1.0)
    if (call.confidence_score === 1.0) {
      console.log('🔄 Using previously corrected transcript (confidence = 100%)');
      transcriptToUse = call.transcript; // Already corrected
    } else {
      console.log('📝 Using original transcript for correction');
    }

    // Create manual correction interface with appropriate transcript
    const correctionInterface = AdvancedSpeakerDiarizationService.createManualCorrectionInterface(transcriptToUse);

    // For backwards compatibility, check for speaker_corrections table
    let existingCorrections = [];
    try {
      const correctionsResult = await query(`
        SELECT *
        FROM speaker_corrections
        WHERE call_id = $1
      `, [callId])
      existingCorrections = correctionsResult.rows
    } catch (error) {
      // Table doesn't exist, that's fine
      console.log('📝 Speaker corrections table not available, using transcript-based storage');
    }

    console.log(`✅ [SPEAKER CORRECTION] Retrieved call ${callId} for correction via PostgreSQL`)

    return NextResponse.json({
      success: true,
      call_info: {
        id: call.id,
        client_name: call.client_name,
        date: call.created_at,
        duration: call.duration,
        confidence_score: call.confidence_score
      },
      correction_interface: correctionInterface,
      existing_corrections: existingCorrections || [],
      instructions: [
        "Review each segment and correct the speaker identification",
        "Green segments have high confidence (>80%)",
        "Yellow segments need review (60-80% confidence)", 
        "Red segments require correction (<60% confidence)",
        "Your corrections will train the AI for future accuracy"
      ]
    });

  } catch (error) {
    console.error('❌ Manual correction retrieval error (PostgreSQL):', error);
    return NextResponse.json({
      error: 'Failed to retrieve call for correction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Save manual corrections
export async function POST(request: NextRequest) {
  try {
    console.log('🎤 [SPEAKER CORRECTION] Saving corrections via PostgreSQL...')
    
    const { callId, corrections, reviewedBy } = await request.json();

    if (!callId || !corrections || !Array.isArray(corrections)) {
      return NextResponse.json({ 
        error: 'Call ID and corrections array are required' 
      }, { status: 400 });
    }

    console.log(`💾 Saving manual corrections for call ${callId} by ${reviewedBy}`);

    // Generate corrected transcript
    const correctedTranscript = generateCorrectedTranscript(corrections);

    // Use transaction for data integrity
    await transaction(async (client) => {
      // Save to speaker_corrections table if it exists (optional)
      try {
        const correctionsToInsert = corrections.map(correction => ({
          call_id: callId,
          segment_id: correction.segment_id,
          text: correction.text.replace(/^\[(?:AGENT|CLIENT)\]:\s*/, ''), // Remove existing labels
          suggested_speaker: correction.suggested_speaker,
          corrected_speaker: correction.corrected_speaker,
          confidence: correction.confidence,
          review_note: correction.review_note || '',
          reviewed_by: reviewedBy,
          created_at: new Date().toISOString()
        }));

        // First, delete existing corrections for this call
        await client.query(`
          DELETE FROM speaker_corrections
          WHERE call_id = $1
        `, [callId])

        // Insert new corrections
        for (const correction of correctionsToInsert) {
          await client.query(`
            INSERT INTO speaker_corrections (
              call_id, segment_id, text, suggested_speaker, corrected_speaker,
              confidence, review_note, reviewed_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            correction.call_id,
            correction.segment_id,
            correction.text,
            correction.suggested_speaker,
            correction.corrected_speaker,
            correction.confidence,
            correction.review_note,
            correction.reviewed_by,
            correction.created_at
          ])
        }

        console.log(`✅ Saved ${correctionsToInsert.length} corrections to speaker_corrections table`)
      } catch (error) {
        console.log('⚠️ Speaker corrections table not available, continuing with transcript update...');
      }

      // Update the call record with corrected transcript
      console.log(`📝 Updating call transcript for ${callId}...`);
      await client.query(`
        UPDATE call_transcriptions
        SET 
          transcript = $1,
          confidence_score = 1.0,
          updated_at = NOW()
        WHERE id = $2
      `, [correctedTranscript, callId])

      console.log('✅ Successfully updated call transcript with manual corrections via PostgreSQL');
    })

    // Trigger AI learning from corrected data
    await triggerAILearningFromCorrections(callId, correctedTranscript, corrections);

    return NextResponse.json({
      success: true,
      message: 'Manual corrections saved successfully',
      corrections_count: corrections.length,
      accuracy_achieved: '100%',
      corrected_transcript: correctedTranscript,
      ai_learning_triggered: true,
      next_steps: [
        "Corrected transcript updated in database",
        "AI system learning from your corrections",
        "Future calls will benefit from improved accuracy",
        "Manual verification complete"
      ]
    });

  } catch (error) {
    console.error('❌ Manual correction save error (PostgreSQL):', error);
    return NextResponse.json({
      error: 'Failed to save manual corrections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to generate corrected transcript
function generateCorrectedTranscript(corrections: Array<{
  segment_id: string;
  text: string;
  corrected_speaker: 'CLIENT' | 'AGENT';
}>): string {
  let correctedTranscript = '';
  
  corrections.forEach(correction => {
    // Remove existing labels from text if present
    const cleanText = correction.text.replace(/^\[(?:AGENT|CLIENT)\]:\s*/, '');
    correctedTranscript += `[${correction.corrected_speaker}]: ${cleanText}\n`;
  });
  
  console.log('📝 Generated corrected transcript preview:', correctedTranscript.substring(0, 300) + '...');
  
  return correctedTranscript;
}

// Trigger AI learning from corrections
async function triggerAILearningFromCorrections(
  callId: string, 
  correctedTranscript: string, 
  corrections: any[]
): Promise<void> {
  try {
    console.log('🧠 Triggering AI learning from manual corrections...');
    
    // Store learning data for AI system
    await query(`
      INSERT INTO ai_learning_data (
        type,
        source_call_id,
        learning_data,
        corrections_count,
        accuracy_improvement,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      'speaker_correction',
      callId,
      JSON.stringify({
        corrected_transcript: correctedTranscript,
        corrections: corrections,
        confidence_achieved: 1.0
      }),
      corrections.length,
      'manual_verification_100%'
    ])
    
    console.log('✅ AI learning data stored for future improvements');
  } catch (error) {
    console.error('⚠️ Could not trigger AI learning:', error);
    // Don't fail the main request for learning issues
  }
} 