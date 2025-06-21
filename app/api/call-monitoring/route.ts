import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

// Simple in-memory cache for call monitoring data
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15000; // 15 seconds cache

// Helper function to normalize phone numbers for matching
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters and leading country codes
  let normalized = phone.replace(/[^0-9]/g, '');
  
  // Remove common country codes (91 for India, 1 for US, etc.)
  if (normalized.startsWith('91') && normalized.length === 12) {
    normalized = normalized.substring(2);
  } else if (normalized.startsWith('1') && normalized.length === 11) {
    normalized = normalized.substring(1);
  }
  
  return normalized;
}

// Helper function to calculate time-based analytics
function calculateTimeBasedStats(calls: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayCalls = calls.filter(call => new Date(call.created_at) >= today);
  const yesterdayCalls = calls.filter(call => {
    const callDate = new Date(call.created_at);
    return callDate >= yesterday && callDate < today;
  });
  const lastWeekCalls = calls.filter(call => new Date(call.created_at) >= lastWeekStart);

  const calculateDuration = (callList: any[]) => {
    const total = callList.reduce((sum, call) => sum + (call.duration || 0), 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getCallStats = (callList: any[]) => ({
    total: callList.length,
    incoming: callList.filter(call => call.call_direction === 'incoming').length,
    outgoing: callList.filter(call => call.call_direction === 'outgoing').length,
    missed: callList.filter(call => 
      call.call_status === 'missed' || 
      call.transcript?.toLowerCase().includes('missed call')
    ).length,
    unanswered: callList.filter(call => 
      call.call_status === 'unanswered' || 
      call.transcript?.toLowerCase().includes('unanswered call')
    ).length,
    answered: callList.filter(call => 
      call.call_status === 'answered' || call.call_status === 'completed' ||
      call.transcript?.toLowerCase().includes('answered') ||
      call.transcript?.toLowerCase().includes('connected')
    ).length,
    duration: calculateDuration(callList),
    uniqueClients: new Set(callList.map(call => normalizePhoneNumber(call.phone_number))).size,
    connectedCalls: callList.filter(call => 
      call.call_status === 'completed' || call.call_status === 'answered'
    ).length
  });

  return {
    today: {
      date: today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      ...getCallStats(todayCalls)
    },
    yesterday: {
      date: yesterday.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      ...getCallStats(yesterdayCalls)
    },
    lastWeek: {
      dateRange: `${lastWeekStart.toLocaleDateString()} to ${today.toLocaleDateString()}`,
      ...getCallStats(lastWeekCalls)
    }
  };
}

// Call monitoring API - PostgreSQL Migration
export async function GET(request: NextRequest) {
  let client
  try {
    console.log('📊 Fetching call monitoring data from PostgreSQL');
    
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId') || searchParams.get('employee_id');
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Check cache first
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      let filteredCalls = cachedData.calls;
      if (employeeId && employeeId !== 'all') {
        filteredCalls = cachedData.calls.filter((call: any) => 
          call.sales_agent === employeeId || call.sales_agent === `Employee ${employeeId}` || 
          call.employee_id === employeeId
        );
      }
      
      return NextResponse.json({
        calls: filteredCalls.slice(0, limit),
        employees: cachedData.employees,
        analytics: cachedData.analytics,
        totalCalls: filteredCalls.length,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000),
        
      });
    }

    client = await pool.connect();

    // Build query with PostgreSQL
    let query = `
      SELECT 
        ct.*,
        -- Extract employee ID from notes or sales_agent
        CASE 
          WHEN ct.notes LIKE '%Employee %' THEN 
            regexp_replace(ct.notes, '.*Employee ([A-Z0-9-]+).*', '\\1')
          WHEN ct.sales_agent LIKE 'Employee %' THEN 
            regexp_replace(ct.sales_agent, 'Employee ([A-Z0-9-]+)', '\\1')
          ELSE ct.sales_agent
        END as employee_id
      FROM call_transcriptions ct
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    // Apply filters
    if (employeeId && employeeId !== 'all') {
      paramCount++;
      query += ` AND (ct.sales_agent = $${paramCount} OR ct.sales_agent = $${paramCount + 1} OR ct.notes LIKE $${paramCount + 2})`;
      params.push(employeeId, `Employee ${employeeId}`, `%Employee ${employeeId}%`);
      paramCount += 2;
    }

    if (status) {
      paramCount++;
      query += ` AND ct.status = $${paramCount}`;
      params.push(status);
    }

    if (dateFrom) {
      paramCount++;
      query += ` AND ct.created_at >= $${paramCount}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      paramCount++;
      query += ` AND ct.created_at <= $${paramCount}`;
      params.push(dateTo);
    }

    query += ` ORDER BY ct.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const callsResult = await client.query(query, params);
    const calls = callsResult.rows;

    console.log(`📞 Found ${calls.length} calls for monitoring`);

    // Get unique employee IDs to fetch their details
    const employeeIds = Array.from(new Set(
      calls
        .map(call => call.employee_id || call.sales_agent)
        .filter(Boolean)
        .map(id => id.replace('Employee ', '').replace(/^EMP0*/, ''))
        .filter(id => !isNaN(parseInt(id)))
    ));

    // Fetch employee details
    let employeeMap: Record<string, { name: string; email: string }> = {};
    if (employeeIds.length > 0) {
      const empQuery = `
        SELECT id, first_name, last_name, email, employee_code
        FROM employees 
        WHERE id = ANY($1)
      `;
      
      const employeesResult = await client.query(empQuery, [employeeIds.map(id => parseInt(id))]);
      
      employeesResult.rows.forEach(emp => {
        const empId = emp.employee_code || `EMP${emp.id.toString().padStart(3, '0')}`;
        employeeMap[empId] = {
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || `Employee ${emp.id}`,
          email: emp.email || ''
        };
      });
    }

    // Get unique phone numbers for lead lookup
    const phoneNumbers = Array.from(new Set(
      calls
        .map(call => normalizePhoneNumber(call.phone_number))
        .filter(Boolean)
    ));

    // Fetch leads data for caller name resolution
    let leadsMap: Record<string, { name: string; lead_number: string; status: string }> = {};
    if (phoneNumbers.length > 0) {
      const leadsQuery = `
        SELECT phone, client_name, id as lead_number, status, whatsapp_number
        FROM leads
        WHERE phone = ANY($1) OR whatsapp_number = ANY($1)
      `;
      
      const leadsResult = await client.query(leadsQuery, [phoneNumbers]);
      
      leadsResult.rows.forEach(lead => {
        const normalizedPhone = normalizePhoneNumber(lead.phone);
        const normalizedWhatsApp = normalizePhoneNumber(lead.whatsapp_number);
        
        const leadData = {
          name: lead.client_name || 'Unknown Client',
          lead_number: lead.lead_number?.toString() || '',
          status: lead.status || 'unknown'
        };
        
        if (normalizedPhone) leadsMap[normalizedPhone] = leadData;
        if (normalizedWhatsApp && normalizedWhatsApp !== normalizedPhone) {
          leadsMap[normalizedWhatsApp] = leadData;
        }
      });
    }

    // Transform calls data with enhanced information
    const transformedCalls = calls.map(call => {
      const normalizedPhone = normalizePhoneNumber(call.phone_number);
      const leadInfo = leadsMap[normalizedPhone];
      const empId = call.employee_id || call.sales_agent?.replace('Employee ', '');
      const employeeInfo = employeeMap[empId] || employeeMap[`EMP${empId}`];

      return {
        ...call,
        employee_id: call.employee_id,
        employee_name: employeeInfo?.name || call.sales_agent || 'Unknown Employee',
        employee_email: employeeInfo?.email || '',
        client_display_name: leadInfo?.name || call.client_name || 'Unknown Caller',
        lead_number: leadInfo?.lead_number || null,
        lead_status: leadInfo?.status || null,
        normalized_phone: normalizedPhone,
        call_outcome: call.call_status || 'unknown',
        has_transcript: call.transcript && call.transcript !== 'Processing...' && call.transcript.length > 10,
        transcript_preview: call.transcript ? call.transcript.substring(0, 100) + '...' : null
      };
    });

    // Calculate time-based analytics
    const analytics = calculateTimeBasedStats(transformedCalls);

    // Calculate employee performance
    const employeeStats = employeeIds.reduce((stats, empId) => {
      const empCalls = transformedCalls.filter(call => 
        call.employee_id === empId || call.sales_agent === `Employee ${empId}`
      );
      
      stats[empId] = {
        totalCalls: empCalls.length,
        answeredCalls: empCalls.filter(call => 
          call.call_status === 'completed' || call.call_status === 'answered'
        ).length,
        totalDuration: empCalls.reduce((sum, call) => sum + (call.duration || 0), 0),
        uniqueClients: new Set(empCalls.map(call => normalizePhoneNumber(call.phone_number))).size,
        leadsConverted: empCalls.filter(call => call.lead_status).length,
        name: employeeMap[empId]?.name || employeeMap[`EMP${empId}`]?.name || `Employee ${empId}`
      };
      
      return stats;
    }, {} as Record<string, any>);

    // Cache the results
    cachedData = {
      calls: transformedCalls,
      employees: employeeMap,
      analytics: {
        timeStats: analytics,
        employeeStats,
        totalCalls: transformedCalls.length,
        totalEmployees: Object.keys(employeeStats).length,
        avgCallDuration: transformedCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / transformedCalls.length || 0,
        callStatusBreakdown: {
          completed: transformedCalls.filter(call => call.call_status === 'completed').length,
          processing: transformedCalls.filter(call => call.call_status === 'processing').length,
          error: transformedCalls.filter(call => call.call_status === 'error').length,
          unanswered: transformedCalls.filter(call => call.call_status === 'unanswered').length
        }
      }
    };
    cacheTimestamp = now;

    console.log('✅ Call monitoring data processed and cached');

    return NextResponse.json({
      success: true,
      calls: transformedCalls,
      employees: employeeMap,
      analytics: cachedData.analytics,
      totalCalls: transformedCalls.length,
      cached: false,
      
    });

  } catch (error) {
    console.error('❌ Call monitoring error:', error);
    return NextResponse.json({
      error: 'Failed to fetch call monitoring data',
      message: error instanceof Error ? error.message : 'Unknown error',
      
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// POST endpoint for updating call status from mobile app - PostgreSQL Migration
export async function POST(request: NextRequest) {
  let client
  try {
    const body = await request.json();
    const {
      phoneNumber,
      contactName, // This can come from mobile contacts
      direction,
      status,
      startTime,
      endTime,
      duration,
      employeeId,
      mobileContactName // Explicit field for mobile contact name
    } = body;

    console.log('📱 Mobile call update request:', { phoneNumber, status, direction, employeeId });

    const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    const agent = employeeId || 'EMP001';

    client = await pool.connect();

    // Check for existing lead first
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    let resolvedContactName = contactName || mobileContactName;

    // Lookup in leads database for better name resolution
    const leadQuery = `
      SELECT client_name, id as lead_number, status
      FROM leads
      WHERE phone = $1 OR whatsapp_number = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const leadResult = await client.query(leadQuery, [normalizedPhone]);
    const leadData = leadResult.rows[0];

    if (leadData && leadData.client_name) {
      resolvedContactName = leadData.client_name;
    }

    // For dynamic status updates, check if there's an active call record
    const recentThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const existingCallQuery = `
      SELECT *
      FROM call_transcriptions
      WHERE phone_number = $1 
        AND sales_agent = $2 
        AND created_at >= $3
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const existingCallResult = await client.query(existingCallQuery, [phoneNumber, agent, recentThreshold]);
    const existingCall = existingCallResult.rows[0];

    let callRecord;

    if (existingCall && (status !== 'ringing')) {
      // Update existing call record
      const updateData: any = {
        updated_at: new Date().toISOString(),
        call_status: status,
        status: status === 'completed' || status === 'missed' || status === 'unanswered' || status === 'answered' ? 'completed' : 'processing'
      };

      // Update transcript based on new status
      let transcript = existingCall.transcript;
      if (status === 'missed') {
        transcript = 'Missed call - client called but agent did not answer';
      } else if (status === 'unanswered') {
        transcript = 'Unanswered call - agent called but client did not answer';
      } else if (status === 'answered') {
        transcript = `${direction || existingCall.call_direction || 'incoming'} call answered`;
      } else if (status === 'completed') {
        transcript = `${direction || existingCall.call_direction || 'incoming'} call completed successfully`;
      }

      let updateQuery = `
        UPDATE call_transcriptions 
        SET updated_at = $1,
            call_status = $2,
            status = $3,
            transcript = $4
      `;
      
      const updateParams = [
        updateData.updated_at,
        updateData.call_status,
        updateData.status,
        transcript
      ];

      let paramCount = 4;

      if (duration) {
        paramCount++;
        updateQuery += `, duration = $${paramCount}`;
        updateParams.push(duration);
      }

      if (resolvedContactName) {
        paramCount++;
        updateQuery += `, client_name = $${paramCount}`;
        updateParams.push(resolvedContactName);
      }

      paramCount++;
      updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
      updateParams.push(existingCall.id);

      const updatedCallResult = await client.query(updateQuery, updateParams);
      callRecord = updatedCallResult.rows[0];

      console.log(`✅ Updated existing call: ${callRecord.id}`);
    } else {
      // Create new call record
      const timestamp = new Date().getTime();
      const callId = `mobile_${agent}_${cleanPhoneNumber}_${timestamp}`;
      
      const transcript = status === 'missed' ? 'Missed call - client called but agent did not answer' :
                        status === 'unanswered' ? 'Unanswered call - agent called but client did not answer' :
                        status === 'answered' ? `${direction || 'outgoing'} call answered` :
                        status === 'completed' ? `${direction || 'outgoing'} call completed successfully` :
                        status === 'ringing' ? `${direction || 'incoming'} call ringing` :
                        `${direction || 'outgoing'} call ${status || 'detected'}`;

      const insertQuery = `
        INSERT INTO call_transcriptions (
          call_id, phone_number, client_name, sales_agent, duration, status,
          call_status, call_direction, notes, transcript, confidence_score,
          language, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const callData = [
        callId,
        phoneNumber,
        resolvedContactName || `${direction === 'incoming' ? 'Incoming' : 'Outgoing'} Call - ${phoneNumber}`,
        agent,
        duration || 0,
        status === 'completed' || status === 'missed' || status === 'unanswered' || status === 'answered' ? 'completed' : 'processing',
        status || 'processing',
        direction || 'outgoing',
        `Direction: ${direction || 'outgoing'}${mobileContactName ? `, Mobile Contact: ${mobileContactName}` : ''}`,
        transcript,
        1.0,
        'en',
        startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        new Date().toISOString()
      ];

      const newCallResult = await client.query(insertQuery, callData);
      callRecord = newCallResult.rows[0];

      console.log(`✅ Created new call: ${callRecord.id}`);
    }

    // Record in communications table for business intelligence
    const communicationQuery = `
      INSERT INTO communications (
        channel_type, message_id, sender_type, sender_id, sender_name,
        recipient_type, recipient_id, recipient_name, content_type, content_text,
        content_metadata, business_context, ai_processed, ai_priority_score,
        sent_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      ON CONFLICT (message_id) DO NOTHING
    `;
    
    await client.query(communicationQuery, [
      'call',
      callRecord.call_id,
      direction === 'incoming' ? 'client' : 'employee',
      phoneNumber,
      resolvedContactName || 'Unknown Caller',
      direction === 'incoming' ? 'employee' : 'client',
      agent,
      agent,
      'call',
      `Call ${status}: ${resolvedContactName || phoneNumber}`,
      JSON.stringify({
        call_status: status,
        direction: direction,
        duration: duration,
        mobile_contact_name: mobileContactName
      }),
      `call_${status}`,
      false,
      status === 'completed' ? 0.8 : 0.5,
      callRecord.created_at
    ]);

    // Clear cache to force refresh
    cachedData = null;

    return NextResponse.json({
      success: true,
      callId: callRecord.call_id,
      message: existingCall && status !== 'ringing' ? 'Call updated successfully' : 'Call created successfully',
      data: {
        phone_number: phoneNumber,
        resolved_contact_name: resolvedContactName,
        status: callRecord.status,
        call_status: callRecord.call_status,
        direction: direction,
        duration: callRecord.duration,
        is_existing_lead: !!leadData,
        created_at: callRecord.created_at,
        updated_at: callRecord.updated_at
      },
      
    });

  } catch (error) {
    console.error('❌ Mobile call update error:', error);
    return NextResponse.json({
      error: 'Failed to update call',
      details: error instanceof Error ? error.message : 'Unknown error',
      
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
} 