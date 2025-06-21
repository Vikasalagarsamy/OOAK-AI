import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Call recording upload request received (Android)');
    
    // Handle FormData properly for Next.js 15
    const formData = await request.formData();
    const entries = Array.from(formData.entries());
    
    const audioFileEntry = entries.find(([key]) => key === 'audio');
    const metadataEntry = entries.find(([key]) => key === 'metadata');
    
    if (!audioFileEntry || !metadataEntry) {
      return NextResponse.json(
        { error: 'Missing audio file or metadata' },
        { status: 400 }
      );
    }
    
    const audioFile = audioFileEntry[1] as File;
    const metadataStr = metadataEntry[1] as string;
    
    if (!audioFile || typeof metadataStr !== 'string') {
      return NextResponse.json(
        { error: 'Invalid audio file or metadata format' },
        { status: 400 }
      );
    }
    
    console.log('🎤 Processing recording:', audioFile.name);
    console.log('📊 Metadata:', metadataStr);
    
    const metadata = JSON.parse(metadataStr);
    
    // Get employee ID from header or metadata
    const employeeId = request.headers.get('X-Employee-ID') || metadata.employeeId;
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID required' },
        { status: 401 }
      );
    }
    
    // Create unique filename
    const fileExtension = audioFile.name.split('.').pop() || 'mp3';
    const uniqueId = randomUUID();
    const fileName = `android_${employeeId}_${Date.now()}.${fileExtension}`;
    
    // Create upload directory path
    const uploadDir = join(process.cwd(), 'uploads', 'call-recordings');
    
    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const filePath = join(uploadDir, fileName);
    
    // Write file
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    console.log('💾 File saved to:', filePath);
    
    // Create accessible URL for the recording
    // Temporarily hardcoded to fix the localhost issue
    const baseUrl = 'https://portal.ooak.photography';
    const accessibleRecordingUrl = `${baseUrl}/api/call-recordings/file/${fileName}`;
    
    // Store in existing call_transcriptions table (matching existing structure)
    const client = await pool.connect();
    
    try {
      const callRecordingData = {
        id: uniqueId,
        call_id: uniqueId, // Use the same ID
        client_name: metadata.contactName || 'Unknown Contact',
        sales_agent: `Employee ${employeeId}`,
        phone_number: metadata.phoneNumber || 'unknown',
        duration: metadata.callEndTime && metadata.callStartTime ? 
          Math.round((metadata.callEndTime - metadata.callStartTime) / 1000) : 0,
        recording_url: accessibleRecordingUrl, // ✅ Accessible URL for transcription
        transcript: 'Processing...',
        confidence_score: 0.0,
        language: 'en',
        detected_language: 'unknown',
        status: 'processing',
        notes: `Android upload from device ${metadata.deviceId}. Direction: ${metadata.direction}`,
        call_direction: metadata.direction || 'unknown',
        call_status: 'processing',
        created_at: metadata.callStartTime ? new Date(metadata.callStartTime).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const insertQuery = `
        INSERT INTO call_transcriptions 
        (id, call_id, client_name, sales_agent, phone_number, duration, recording_url, 
         transcript, confidence_score, language, detected_language, status, notes, 
         call_direction, call_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        callRecordingData.id,
        callRecordingData.call_id,
        callRecordingData.client_name,
        callRecordingData.sales_agent,
        callRecordingData.phone_number,
        callRecordingData.duration,
        callRecordingData.recording_url,
        callRecordingData.transcript,
        callRecordingData.confidence_score,
        callRecordingData.language,
        callRecordingData.detected_language,
        callRecordingData.status,
        callRecordingData.notes,
        callRecordingData.call_direction,
        callRecordingData.call_status,
        callRecordingData.created_at,
        callRecordingData.updated_at
      ]);
      
      const data = result.rows[0];
    
      console.log('✅ Call recording saved successfully in PostgreSQL:', data.id);
      
      // Trigger background processing for Android uploads too
      processAndroidCallInBackground(uniqueId, filePath, accessibleRecordingUrl, metadata).catch(error => {
        console.error('Android background processing error:', error);
      });
      
      return NextResponse.json({
        success: true,
        recordingId: data.id,
        fileName: fileName,
        message: 'Call recording uploaded successfully from Android device',
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (dbError: any) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save recording metadata: ' + dbError.message },
        { status: 500 }
      );
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Call recording upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Call recordings retrieval - PostgreSQL Migration
export async function GET(request: NextRequest) {
  let client
  try {
    console.log('📞 Fetching call recordings from PostgreSQL')
    
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') || request.headers.get('X-Employee-ID')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    
    client = await pool.connect()
    
    // Build dynamic query with filters
    let query = `
      SELECT 
        ct.id,
        ct.call_id,
        ct.client_name,
        ct.sales_agent,
        ct.phone_number,
        ct.duration,
        ct.recording_url,
        ct.transcript,
        ct.confidence_score,
        ct.language,
        ct.detected_language,
        ct.status,
        ct.notes,
        ct.call_direction,
        ct.call_status,
        ct.created_at,
        ct.updated_at,
        -- Extract employee ID from notes or sales_agent
        CASE 
          WHEN ct.notes LIKE '%Employee %' THEN 
            regexp_replace(ct.notes, '.*Employee ([A-Z0-9-]+).*', '\\1')
          WHEN ct.sales_agent LIKE 'Employee %' THEN 
            regexp_replace(ct.sales_agent, 'Employee ([A-Z0-9-]+)', '\\1')
          ELSE 'unknown'
        END as employee_id,
        -- Extract device ID from notes
        CASE 
          WHEN ct.notes LIKE '%device %' THEN 
            regexp_replace(ct.notes, '.*device ([A-Za-z0-9-]+).*', '\\1')
          ELSE 'unknown'
        END as device_id,
        -- Calculate file size (placeholder for now)
        0 as recording_file_size
      FROM call_transcriptions ct
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramCount = 0
    
    // Add filters
    if (employeeId) {
      paramCount++
      query += ` AND (ct.notes LIKE $${paramCount} OR ct.sales_agent LIKE $${paramCount})`
      params.push(`%Employee ${employeeId}%`)
    }
    
    if (status) {
      paramCount++
      query += ` AND ct.status = $${paramCount}`
      params.push(status)
    }
    
    if (dateFrom) {
      paramCount++
      query += ` AND ct.created_at >= $${paramCount}`
      params.push(dateFrom)
    }
    
    if (dateTo) {
      paramCount++
      query += ` AND ct.created_at <= $${paramCount}`
      params.push(dateTo)
    }
    
    // Add ordering and pagination
    query += ` ORDER BY ct.created_at DESC`
    
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(limit)
    
    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push(offset)
    
    console.log(`🔍 Executing query with ${params.length} parameters`)
    const result = await client.query(query, params)
    
    // Transform to match expected format
    const transformedRecordings = result.rows.map(record => ({
      id: record.id,
      call_id: record.call_id,
      employee_id: record.employee_id,
      phone_number: record.phone_number,
      contact_name: record.client_name,
      client_name: record.client_name,
      sales_agent: record.sales_agent,
      direction: record.call_direction || 'unknown',
      call_direction: record.call_direction,
      call_start_time: record.created_at,
      call_end_time: record.updated_at,
      duration: record.duration,
      recording_file_name: record.recording_url?.split('/').pop() || 'unknown',
      recording_file_path: record.recording_url,
      recording_url: record.recording_url,
      recording_file_size: record.recording_file_size,
      device_id: record.device_id,
      is_matched: true,
      upload_timestamp: record.created_at,
      status: record.status,
      call_status: record.call_status,
      transcription_status: record.status === 'completed' ? 'completed' : 'pending',
      transcription_text: record.transcript !== 'Processing...' ? record.transcript : null,
      transcript: record.transcript,
      transcription_confidence: record.confidence_score,
      confidence_score: record.confidence_score,
      language: record.language,
      detected_language: record.detected_language,
      notes: record.notes,
      ai_summary: null, // Could be enhanced later
      ai_sentiment: null, // Could be enhanced later
      created_at: record.created_at,
      updated_at: record.updated_at
    }))
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM call_transcriptions ct
      WHERE 1=1
    `
    
    const countParams: any[] = []
    let countParamCount = 0
    
    if (employeeId) {
      countParamCount++
      countQuery += ` AND (ct.notes LIKE $${countParamCount} OR ct.sales_agent LIKE $${countParamCount})`
      countParams.push(`%Employee ${employeeId}%`)
    }
    
    if (status) {
      countParamCount++
      countQuery += ` AND ct.status = $${countParamCount}`
      countParams.push(status)
    }
    
    if (dateFrom) {
      countParamCount++
      countQuery += ` AND ct.created_at >= $${countParamCount}`
      countParams.push(dateFrom)
    }
    
    if (dateTo) {
      countParamCount++
      countQuery += ` AND ct.created_at <= $${countParamCount}`
      countParams.push(dateTo)
    }
    
    const countResult = await client.query(countQuery, countParams)
    const totalCount = parseInt(countResult.rows[0].total)
    
    console.log(`✅ Found ${transformedRecordings.length} call recordings (${totalCount} total)`)
    
    return NextResponse.json({
      success: true,
      recordings: transformedRecordings,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: offset + limit < totalCount
      },
      statistics: {
        total_recordings: totalCount,
        processing: transformedRecordings.filter(r => r.status === 'processing').length,
        completed: transformedRecordings.filter(r => r.status === 'completed').length,
        error: transformedRecordings.filter(r => r.status === 'error').length
      },
      
    })
    
  } catch (error) {
    console.error('❌ Error fetching call recordings:', error)
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

// Background processing for Android uploads - PostgreSQL Migration
async function processAndroidCallInBackground(callId: string, audioFilePath: string, recordingUrl: string, metadata: any) {
  let client
  try {
    console.log(`🔄 Starting Android call processing for ${callId}`)
    
    client = await pool.connect()
    
    // Update status to transcribing
    await client.query(
      'UPDATE call_transcriptions SET status = $1, updated_at = NOW() WHERE id = $2',
      ['transcribing', callId]
    )

    // Import the services dynamically
    const { LocalCallAnalyticsTranslationService } = await import('@/services/local-call-analytics-service-translation');
    const analyticsService = new LocalCallAnalyticsTranslationService();

    console.log(`🤖 Processing Android call recording with Whisper...`);

    // Process the call with Whisper
    const result = await analyticsService.processCallRecording(
      audioFilePath,
      metadata.contactName || 'Unknown Contact',
      0,
      'large-v3'
    );

    const translationResult = result.translationResult;
    const rawTranscript = translationResult.english_translation || '';

    console.log(`📝 Android transcript generated: ${rawTranscript.substring(0, 100)}...`);

    // Update call record with results
    await client.query(`
      UPDATE call_transcriptions 
      SET transcript = $1,
          duration = $2,
          confidence_score = $3,
          detected_language = $4,
          status = $5,
          updated_at = NOW()
      WHERE id = $6
    `, [
      rawTranscript,
      translationResult.duration || 0,
      translationResult.language_confidence || 0.0,
      translationResult.detected_language || 'unknown',
      'completed',
      callId
    ])

    console.log(`✅ Android call transcription completed for ${callId}`);

  } catch (error) {
    console.error(`❌ Android processing failed for call ${callId}:`, error);
    
    if (client) {
      try {
        await client.query(`
          UPDATE call_transcriptions 
          SET status = $1, 
              transcript = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [
          'error',
          `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          callId
        ])
      } catch (updateError) {
        console.error('Failed to update error status:', updateError)
      }
    }
  } finally {
    if (client) {
      client.release()
    }
  }
} 