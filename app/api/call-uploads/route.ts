import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

export async function GET(request: NextRequest) {
  let client;
  try {
    console.log('📞 Fetching call uploads from PostgreSQL...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const clientName = searchParams.get('client');
    
    client = await pool.connect();
    
    // Enhanced query with filtering and statistics
    let query = `
      SELECT 
        ct.id,
        ct.client_name,
        ct.created_at,
        ct.status,
        ct.task_id,
        ct.notes,
        ct.duration,
        ct.recording_url,
        ct.transcript,
        -- Additional intelligence
        LENGTH(ct.transcript) as transcript_length,
        CASE 
          WHEN ct.duration > 1800 THEN 'Long'
          WHEN ct.duration > 600 THEN 'Medium'
          ELSE 'Short'
        END as call_duration_category
      FROM call_transcriptions ct
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND ct.status = $${paramCount}`;
      params.push(status);
    }
    
    if (clientName) {
      paramCount++;
      query += ` AND ct.client_name ILIKE $${paramCount}`;
      params.push(`%${clientName}%`);
    }
    
    query += ` ORDER BY ct.created_at DESC`;
    
    if (limit > 0) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);
    }
    
    const result = await client.query(query, params);
    
    // Transform data for the frontend with enhanced information
    const transformedUploads = result.rows.map(upload => ({
      id: upload.id,
      client: upload.client_name,
      date: upload.created_at,
      status: getStatusDisplay(upload.status),
      statusRaw: upload.status,
      taskId: upload.task_id,
      notes: upload.notes,
      duration: upload.duration,
      durationCategory: upload.call_duration_category,
      hasTranscript: !!upload.transcript,
      transcriptLength: upload.transcript_length,
      recordingUrl: upload.recording_url,
      metadata: {
        callQuality: upload.duration > 300 ? 'Good' : 'Short',
        contentRichness: upload.transcript_length > 1000 ? 'Rich' : 'Basic'
      }
    }));
    
    // Generate summary statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_uploads,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_uploads,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_uploads,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_uploads,
        AVG(duration) as avg_duration
      FROM call_transcriptions
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    client.release();
    
    console.log(`✅ Found ${transformedUploads.length} call uploads from PostgreSQL`);

    return NextResponse.json({
      uploads: transformedUploads,
      statistics: {
        total: parseInt(stats.total_uploads),
        completed: parseInt(stats.completed_uploads),
        processing: parseInt(stats.processing_uploads),
        recent: parseInt(stats.recent_uploads),
        averageDuration: Math.round(parseFloat(stats.avg_duration) || 0)
      },
      metadata: {
        source: 'PostgreSQL',
        timestamp: new Date().toISOString(),
        filters: { status, clientName, limit },
        enhanced_features: ['duration_analysis', 'content_metrics', 'call_quality_assessment']
      }
    });

  } catch (error: any) {
    if (client) client.release();
    console.error('❌ Call uploads PostgreSQL error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch call uploads', 
      details: error.message,
      source: 'PostgreSQL'
    }, { status: 500 });
  }
}

function getStatusDisplay(status: string | null): string {
  switch (status) {
    case 'processing':
      return 'Uploaded';
    case 'transcribing':
      return 'Processing';
    case 'completed':
      return 'Completed';
    case 'error':
      return 'Error';
    case 'analyzing':
      return 'Analyzing';
    default:
      return 'Uploaded';
  }
} 