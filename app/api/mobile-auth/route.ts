import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';
import bcrypt from 'bcryptjs';

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

export async function POST(request: NextRequest) {
  try {
    const { username, password, deviceId } = await request.json();

    console.log(`🐘 Mobile auth request (PostgreSQL): ${username} with device ${deviceId}`);

    if (!username || !password || !deviceId) {
      return NextResponse.json(
        { error: 'Username, password, and device ID are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Authenticate user credentials with bcrypt
      const userQuery = `
        SELECT id, email, username, employee_id, password_hash, is_active
        FROM user_accounts
        WHERE LOWER(username) = LOWER($1)
      `;
      const userResult = await client.query(userQuery, [username]);

      if (userResult.rows.length === 0) {
        console.error('❌ User not found:', { username });
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const user = userResult.rows[0];

      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        console.error('❌ Invalid password for user:', username);
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      if (!user.is_active) {
        console.error('❌ User account inactive:', username);
        return NextResponse.json(
          { error: 'User account is not active' },
          { status: 403 }
        );
      }

      console.log(`✅ User authenticated from PostgreSQL: ${user.username} (employee_id: ${user.employee_id})`);

      // Get employee information
      const empQuery = `
        SELECT id, employee_id, first_name, last_name, name, email, phone
        FROM employees
        WHERE id = $1
      `;
      const empResult = await client.query(empQuery, [user.employee_id]);

      if (empResult.rows.length === 0) {
        console.error('❌ Employee not found for user:', { userId: user.id, employeeId: user.employee_id });
        return NextResponse.json(
          { error: 'Employee record not found' },
          { status: 404 }
        );
      }

      const employee = empResult.rows[0];
      console.log(`✅ Employee found in PostgreSQL: ${employee.employee_id} - ${employee.first_name} ${employee.last_name}`);

      // Auto-register device with timestamp
      const timestampedDeviceId = `${deviceId}_${Date.now()}`;
      const deviceName = `${employee.first_name}'s Phone (Android)`;
      const fcmToken = `android_device_${Date.now()}`;

      try {
        const deviceQuery = `
          INSERT INTO employee_devices 
          (employee_id, device_id, device_name, platform, app_version, fcm_token, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await client.query(deviceQuery, [
          employee.employee_id,
          timestampedDeviceId,
          deviceName,
          'android',
          '1.1.0',
          fcmToken,
          true
        ]);
        console.log(`📱 Device registered in PostgreSQL: ${timestampedDeviceId}`);
      } catch (deviceError) {
        console.error('⚠️ Device registration failed:', deviceError);
      }

      // Return successful authentication response
      const employeeName = employee.name || `${employee.first_name} ${employee.last_name}`.trim();
      const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        employee: {
          id: employee.id,
          employeeId: employee.employee_id, // This is the correct format like EMP-25-0001
          name: employeeName,
          email: employee.email || ''
        },
        authentication: {
          deviceId: timestampedDeviceId,
          authenticatedAt: new Date().toISOString(),
          validUntil: validUntil
        },
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ Mobile auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check authentication status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username parameter required'
      }, { status: 400 });
    }

    console.log(`🐘 Checking auth status for ${username} (PostgreSQL)...`);

    const client = await pool.connect();

    try {
      // Get user with employee information in a single JOIN query
      const query = `
        SELECT 
          ua.id,
          ua.username,
          ua.email,
          ua.is_active,
          ua.last_login,
          ua.employee_id,
          e.id as emp_id,
          e.name as emp_name,
          e.first_name,
          e.last_name,
          e.email as emp_email,
          e.status as emp_status
        FROM user_accounts ua
        LEFT JOIN employees e ON ua.employee_id = e.id
        WHERE LOWER(ua.username) = LOWER($1) AND ua.is_active = true
      `;
      
      const result = await client.query(query, [username]);

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }

      const row = result.rows[0];
      const employeeName = row.emp_name || 
                          (row.first_name && row.last_name ? 
                           `${row.first_name} ${row.last_name}` : 
                           `Employee #${row.emp_id}`);

      const employeeCode = row.emp_id ? `EMP${row.emp_id.toString().padStart(3, '0')}` : null;

      console.log(`✅ Auth status retrieved from PostgreSQL for ${username}`);

      return NextResponse.json({
        success: true,
        user: {
          id: row.id,
          username: row.username,
          email: row.email,
          isActive: row.is_active,
          lastLogin: row.last_login
        },
        employee: row.emp_id ? {
          id: row.emp_id,
          employeeId: employeeCode,
          name: employeeName,
          email: row.emp_email,
          status: row.emp_status || 'active'
        } : null,
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('❌ Error checking auth status:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 