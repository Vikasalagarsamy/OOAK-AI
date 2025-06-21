import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';
import { randomUUID } from 'crypto';

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Call recording creation request (PostgreSQL)');
    
    const body = await request.json();
    const { employeeId, phoneNumber, contactName, direction, duration, recordingUrl } = body;
    
    if (!employeeId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Employee ID and phone number are required' },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      const uniqueId = randomUUID();
      
      const insertQuery = `
        INSERT INTO call_transcriptions 
        (id, call_id, client_name, sales_agent, phone_number, duration, recording_url, 
         transcript, confidence_score, language, detected_language, status, notes, 
         call_direction, call_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        uniqueId,                                    // id
        uniqueId,                                    // call_id
        contactName || 'Unknown Contact',            // client_name
        `Employee ${employeeId}`,                    // sales_agent
        phoneNumber,                                 // phone_number
        duration || 0,                               // duration
        recordingUrl || null,                        // recording_url
        'Processing...',                             // transcript
        0.0,                                         // confidence_score
        'en',                                        // language
        'unknown',                                   // detected_language
        'processing',                                // status
        `Manual entry for employee ${employeeId}`,  // notes
        direction || 'outgoing',                     // call_direction
        'processing',                                // call_status
        new Date().toISOString(),                    // created_at
        new Date().toISOString()                     // updated_at
      ]);
      
      const data = result.rows[0];
      
      console.log('✅ Call recording saved successfully in PostgreSQL:', data.id);
      
      return NextResponse.json({
        success: true,
        recordingId: data.id,
        message: 'Call recording created successfully',
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('❌ Call recording creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    console.log('🐘 Fetching call recordings from PostgreSQL...');
    
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT * FROM call_transcriptions
        WHERE 1=1
      `;
      const params: any[] = [];
      
      // Filter by employee if provided
      if (employeeId) {
        query += ` AND sales_agent ILIKE $${params.length + 1}`;
        params.push(`%Employee ${employeeId}%`);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const result = await client.query(query, params);
      
      // Transform to match expected format
      const transformedRecordings = result.rows.map((record: any) => ({
        id: record.id,
        employee_id: record.sales_agent?.includes('Employee') ? 
          record.sales_agent.match(/Employee (\w+)/)?.[1] : 'unknown',
        phone_number: record.phone_number,
        contact_name: record.client_name,
        direction: record.call_direction || 'unknown',
        call_start_time: record.created_at,
        call_end_time: record.updated_at,
        recording_url: record.recording_url,
        duration: record.duration,
        status: record.status,
        transcription_status: record.status === 'completed' ? 'completed' : 'pending',
        transcription_text: record.transcript !== 'Processing...' ? record.transcript : null,
        transcription_confidence: record.confidence_score,
        notes: record.notes,
        created_at: record.created_at,
        updated_at: record.updated_at
      }));
      
      console.log(`✅ Retrieved ${transformedRecordings.length} call recordings from PostgreSQL`);
      
      return NextResponse.json({
        success: true,
        recordings: transformedRecordings,
        total: transformedRecordings.length,
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      });
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error('❌ Error fetching call recordings:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 