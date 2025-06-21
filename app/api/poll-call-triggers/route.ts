import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    console.log('📞 [POLL CALL TRIGGERS] Polling via PostgreSQL...')
    
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const deviceId = searchParams.get('deviceId')

    if (!employeeId || !deviceId) {
      return NextResponse.json(
        { error: 'Employee ID and Device ID are required' },
        { status: 400 }
      )
    }

    // Update device last seen and get pending triggers
    await transaction(async (client) => {
      // Update device last seen
      await client.query(`
        UPDATE employee_devices
        SET last_seen = NOW()
        WHERE employee_id = $1 AND device_id = $2
      `, [employeeId, deviceId])

      // Get pending call triggers for this employee
      const result = await client.query(`
        SELECT *
        FROM call_triggers
        WHERE employee_id = $1
          AND status = 'pending'
          AND triggered_at >= NOW() - INTERVAL '5 minutes'
        ORDER BY triggered_at DESC
        LIMIT 5
      `, [employeeId])

      console.log(`✅ [POLL CALL TRIGGERS] Found ${result.rows.length} pending triggers for employee ${employeeId}`)

      return NextResponse.json({
        success: true,
        triggers: result.rows,
        count: result.rows.length
      })
    })

  } catch (error) {
    console.error('❌ Poll call triggers API error (PostgreSQL):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📞 [POLL CALL TRIGGERS] Updating trigger status via PostgreSQL...')
    
    const { triggerId, status, employeeId, responseData } = await request.json()

    if (!triggerId || !status || !employeeId) {
      return NextResponse.json(
        { error: 'Trigger ID, status, and employee ID are required' },
        { status: 400 }
      )
    }

    // Update trigger status
    await query(`
      UPDATE call_triggers
      SET 
        status = $1,
        executed_at = CASE WHEN $1 = 'executed' THEN NOW() ELSE executed_at END,
        response_data = $2,
        updated_at = NOW()
      WHERE id = $3 AND employee_id = $4
    `, [status, responseData ? JSON.stringify(responseData) : null, triggerId, employeeId])

    console.log(`✅ Call trigger ${triggerId} updated to status: ${status} via PostgreSQL`)

    return NextResponse.json({
      success: true,
      message: 'Call trigger status updated via PostgreSQL'
    })

  } catch (error) {
    console.error('❌ Update call trigger API error (PostgreSQL):', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 