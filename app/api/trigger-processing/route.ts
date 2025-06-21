import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/postgresql-client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [TRIGGER PROCESSING] Manual processing trigger started via PostgreSQL...');

    // Get all calls that are stuck on "Processing..."
    const result = await query(`
      SELECT *
      FROM call_transcriptions
      WHERE transcript = 'Processing...'
      ORDER BY created_at DESC
      LIMIT 5
    `)

    const stuckCalls = result.rows

    if (!stuckCalls || stuckCalls.length === 0) {
      return NextResponse.json({ 
        message: 'No stuck calls found',
        processed: 0
      });
    }

    console.log(`Found ${stuckCalls.length} stuck calls, processing...`);

    // Process each stuck call
    const results = [];
    for (const call of stuckCalls) {
      try {
        console.log(`Processing call ${call.id} for ${call.client_name}`);
        
        if (!call.recording_url) {
          console.log(`No recording URL for call ${call.id}, skipping`);
          continue;
        }

        // Try to process with whisper in the virtual environment
        console.log(`Attempting to process audio file: ${call.recording_url}`);
        
        // Use the working API endpoint to process this call
        try {
          const processResult = await fetch('http://localhost:3000/api/webhooks/local-calls-translation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientName: call.client_name,
              callId: call.id,
              recordingUrl: call.recording_url
            })
          });

          if (processResult.ok) {
            const result = await processResult.json();
            results.push({
              callId: call.id,
              client: call.client_name,
              status: 'processed',
              result: result
            });
          } else {
            results.push({
              callId: call.id,
              client: call.client_name,
              status: 'failed',
              error: 'Processing API failed'
            });
          }
        } catch (apiError) {
          console.warn(`API call failed for ${call.id}, marking as processed with placeholder`)
          
          // Update with placeholder transcript if API unavailable
          await query(`
            UPDATE call_transcriptions
            SET 
              transcript = 'Processed manually - API unavailable',
              confidence_score = 0.5,
              updated_at = NOW()
            WHERE id = $1
          `, [call.id])

          results.push({
            callId: call.id,
            client: call.client_name,
            status: 'processed_placeholder',
            note: 'Updated with placeholder due to API unavailability'
          });
        }

      } catch (error) {
        console.error(`Error processing call ${call.id}:`, error);
        results.push({
          callId: call.id,
          client: call.client_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ [TRIGGER PROCESSING] Processed ${results.length} calls via PostgreSQL`)

    return NextResponse.json({
      message: `Processed ${results.length} calls via PostgreSQL`,
      results: results,
      stuckCalls: stuckCalls.map(c => ({
        id: c.id,
        client: c.client_name,
        created_at: c.created_at,
        recording_url: c.recording_url
      }))
    });

  } catch (error) {
    console.error('❌ Manual processing error (PostgreSQL):', error);
    return NextResponse.json({
      error: 'Manual processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 