import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client';

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

export async function POST(request: NextRequest) {
  try {
    const { employeeId, deviceId, deviceName, appVersion, fcmToken } = await request.json()

    console.log(`🐘 Device registration request (PostgreSQL): ${employeeId} - ${deviceId}`)

    if (!employeeId || !deviceId) {
      return NextResponse.json(
        { error: 'Employee ID and Device ID are required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      // Verify employee exists - try both employee_id and numeric id
      let employee = null
      
      // First try direct employee_id lookup
      let query = `
        SELECT id, employee_id, first_name, last_name, email
        FROM employees
        WHERE employee_id = $1
      `;
      let result = await client.query(query, [employeeId]);

      if (result.rows.length > 0) {
        employee = result.rows[0];
      } else {
        // Try numeric ID lookup
        const numericMatch = employeeId.match(/\d+/)
        if (numericMatch) {
          const numericId = parseInt(numericMatch[0])
          query = `
            SELECT id, employee_id, first_name, last_name, email
            FROM employees
            WHERE id = $1
          `;
          result = await client.query(query, [numericId]);
          
          if (result.rows.length > 0) {
            employee = result.rows[0];
          }
        }
      }

      if (!employee) {
        console.error('❌ Employee not found during registration:', { employeeId })
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
      }

      console.log(`✅ Employee verified from PostgreSQL: ${employee.employee_id} - ${employee.first_name} ${employee.last_name}`)

      // Insert or update device registration using PostgreSQL UPSERT (ON CONFLICT)
      const deviceQuery = `
        INSERT INTO employee_devices 
        (employee_id, device_id, device_name, platform, app_version, fcm_token, is_active, last_seen)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (device_id) 
        DO UPDATE SET 
          employee_id = EXCLUDED.employee_id,
          device_name = EXCLUDED.device_name,
          platform = EXCLUDED.platform,
          app_version = EXCLUDED.app_version,
          fcm_token = EXCLUDED.fcm_token,
          is_active = EXCLUDED.is_active,
          last_seen = EXCLUDED.last_seen
        RETURNING *
      `;

      const deviceResult = await client.query(deviceQuery, [
        employee.employee_id, // Use actual employee_id format
        deviceId,
        deviceName || 'Android Device',
        'android',
        appVersion || '1.0.0',
        fcmToken,
        true,
        new Date().toISOString()
      ]);

      console.log(`✅ Device registered successfully in PostgreSQL: ${employee.employee_id} - ${deviceId}`)

      return NextResponse.json({
        success: true,
        message: 'Device registered successfully',
        employee: {
          id: employee.id,
          employeeId: employee.employee_id,
          name: `${employee.first_name} ${employee.last_name}`.trim(),
          email: employee.email
        },
        deviceId: deviceId,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ Employee registration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { employeeId, deviceId, fcmToken, lastSeen } = await request.json()

    console.log(`🐘 Updating device info (PostgreSQL): ${employeeId} - ${deviceId}`)

    if (!employeeId || !deviceId) {
      return NextResponse.json(
        { error: 'Employee ID and Device ID are required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      // Update device last seen and FCM token
      const updateQuery = `
        UPDATE employee_devices 
        SET 
          fcm_token = $1,
          last_seen = $2,
          is_active = true
        WHERE device_id = $3
      `;

      await client.query(updateQuery, [
        fcmToken,
        lastSeen || new Date().toISOString(),
        deviceId
      ]);

      console.log(`✅ Device info updated in PostgreSQL: ${employeeId} - ${deviceId}`)

      return NextResponse.json({
        success: true,
        message: 'Device info updated successfully',
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ Device update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 