import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Processing call status update in PostgreSQL...');
    
    const body = await request.json();
    const {
      phoneNumber,
      contactName,
      direction, // 'incoming' or 'outgoing'
      status, // 'ringing', 'connected', 'ended', 'missed'
      startTime,
      endTime,
      duration,
      employeeId,
      taskId,
      leadId
    } = body;

    console.log('Call status update:', {
      phoneNumber,
      contactName,
      direction,
      status,
      employeeId
    });

    const client = await pool.connect();

    // Start transaction for call status update
    await client.query('BEGIN');

    try {
      // Enhanced call data with business intelligence
      const callData = {
        phone_number: phoneNumber,
        client_name: contactName || `Mobile Call - ${phoneNumber}`,
        sales_agent: employeeId || 'Unknown Agent',
        call_direction: direction,
        call_status: status,
        start_time: startTime,
        end_time: endTime,
        duration: duration || 0,
        task_id: taskId,
        lead_id: leadId,
        transcript: `Call ${status} - ${direction} call ${status === 'ended' ? 'completed' : 'in progress'}`,
        confidence_score: 1.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if call record already exists (for updates)
      const existingCallQuery = `
        SELECT id FROM call_transcriptions 
        WHERE phone_number = $1 AND start_time = $2
      `;
      
      const existingResult = await client.query(existingCallQuery, [phoneNumber, startTime]);

      let callRecord;
      
      if (existingResult.rows.length > 0) {
        // Update existing call record
        const updateQuery = `
          UPDATE call_transcriptions 
          SET 
            client_name = $1,
            sales_agent = $2,
            call_direction = $3,
            call_status = $4,
            end_time = $5,
            duration = $6,
            task_id = $7,
            lead_id = $8,
            transcript = $9,
            updated_at = $10
          WHERE phone_number = $11 AND start_time = $12
          RETURNING *
        `;
        
        const updateValues = [
          callData.client_name,
          callData.sales_agent,
          callData.call_direction,
          callData.call_status,
          callData.end_time,
          callData.duration,
          callData.task_id,
          callData.lead_id,
          callData.transcript,
          callData.updated_at,
          phoneNumber,
          startTime
        ];

        const updateResult = await client.query(updateQuery, updateValues);
        callRecord = updateResult.rows[0];
        console.log('✅ Call record updated:', callRecord.id);
      } else {
        // Insert new call record
        const insertQuery = `
          INSERT INTO call_transcriptions (
            phone_number,
            client_name,
            sales_agent,
            call_direction,
            call_status,
            start_time,
            end_time,
            duration,
            task_id,
            lead_id,
            transcript,
            confidence_score,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;
        
        const insertValues = [
          callData.phone_number,
          callData.client_name,
          callData.sales_agent,
          callData.call_direction,
          callData.call_status,
          callData.start_time,
          callData.end_time,
          callData.duration,
          callData.task_id,
          callData.lead_id,
          callData.transcript,
          callData.confidence_score,
          callData.created_at,
          callData.updated_at
        ];

        const insertResult = await client.query(insertQuery, insertValues);
        callRecord = insertResult.rows[0];
        console.log('✅ New call record created:', callRecord.id);
      }

      // Update related lead if leadId is provided
      if (leadId) {
        const updateLeadQuery = `
          UPDATE leads 
          SET 
            last_contacted = $1,
            updated_at = $2
          WHERE id = $3
        `;
        
        await client.query(updateLeadQuery, [
          new Date().toISOString(),
          new Date().toISOString(),
          leadId
        ]);
        
        console.log('✅ Lead last_contacted updated');
      }

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        callId: callRecord.id,
        message: 'Call status updated successfully in PostgreSQL',
        data: {
          phone_number: phoneNumber,
          status: status,
          direction: direction,
          duration: duration
        },
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString(),
          operation: existingResult.rows.length > 0 ? 'updated' : 'created'
        }
      });

    } catch (transactionError) {
      await client.query('ROLLBACK');
      client.release();
      throw transactionError;
    }

  } catch (error: any) {
    console.error('❌ Call status update error:', error);
    return NextResponse.json({
      error: 'Failed to update call status',
      details: error.message,
      source: "PostgreSQL"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📞 Fetching call records from PostgreSQL...');
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const direction = searchParams.get('direction');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeAnalytics = searchParams.get('analytics') === 'true';

    const client = await pool.connect();

    // Enhanced query with employee details and analytics
    let query = `
      SELECT 
        ct.*,
        -- Employee details
        COALESCE(e.name, 
          CASE 
            WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
            THEN CONCAT(e.first_name, ' ', e.last_name)
            ELSE CONCAT('Employee #', e.id)
          END
        ) as agent_name,
        e.department_id,
        d.name as department_name,
        -- Lead details
        l.client_name as lead_client_name,
        l.status as lead_status,
        -- Call analytics
        CASE 
          WHEN ct.created_at::date = CURRENT_DATE THEN 'Today'
          WHEN ct.created_at::date = CURRENT_DATE - INTERVAL '1 day' THEN 'Yesterday'
          WHEN ct.created_at::date >= CURRENT_DATE - INTERVAL '7 days' THEN 'This Week'
          ELSE 'Older'
        END as time_period
      FROM call_transcriptions ct
      LEFT JOIN employees e ON (
        CASE 
          WHEN ct.sales_agent ~ '^[0-9]+$' THEN ct.sales_agent::integer = e.id
          WHEN ct.sales_agent = 'EMP001' THEN e.id = 1
          WHEN ct.sales_agent = 'EMP002' THEN e.id = 2
          ELSE FALSE
        END
      )
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN leads l ON ct.lead_id = l.id
    `;

    let params: any[] = [];
    let conditions: string[] = [];
    let paramCount = 0;

    // Apply filters
    if (employeeId) {
      paramCount++;
      conditions.push(`ct.sales_agent = $${paramCount}`);
      params.push(employeeId);
    }

    if (status) {
      paramCount++;
      conditions.push(`ct.call_status = $${paramCount}`);
      params.push(status);
    }

    if (direction) {
      paramCount++;
      conditions.push(`ct.call_direction = $${paramCount}`);
      params.push(direction);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY ct.created_at DESC';

    if (limit > 0) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(limit);
    }

    const result = await client.query(query, params);

    // Generate analytics if requested
    let analytics = {};
    if (includeAnalytics && result.rows.length > 0) {
      const analyticsQuery = `
        SELECT 
          COUNT(*) as total_calls,
          COUNT(CASE WHEN call_status = 'completed' THEN 1 END) as completed_calls,
          COUNT(CASE WHEN call_status = 'missed' THEN 1 END) as missed_calls,
          COUNT(CASE WHEN call_direction = 'incoming' THEN 1 END) as incoming_calls,
          COUNT(CASE WHEN call_direction = 'outgoing' THEN 1 END) as outgoing_calls,
          AVG(duration) as avg_duration,
          COUNT(DISTINCT sales_agent) as unique_agents
        FROM call_transcriptions
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `;
      
      const analyticsResult = await client.query(analyticsQuery);
      analytics = analyticsResult.rows[0];
    }

    client.release();

    console.log(`✅ Found ${result.rows.length} call records from PostgreSQL`);

    return NextResponse.json({
      success: true,
      calls: result.rows || [],
      count: result.rows?.length || 0,
      analytics: includeAnalytics ? analytics : undefined,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        filters: {
          employeeId,
          status,
          direction,
          limit
        },
        analytics_included: includeAnalytics
      }
    });

  } catch (error: any) {
    console.error('❌ Fetch calls error:', error);
    return NextResponse.json({
      error: 'Failed to fetch calls',
      details: error.message,
      source: "PostgreSQL"
    }, { status: 500 });
  }
} 