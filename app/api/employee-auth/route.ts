import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/postgresql-client';

// Direct PostgreSQL connection
// Using centralized PostgreSQL client;

export async function POST(request: NextRequest) {
  try {
    const { employeeId, deviceId } = await request.json();

    console.log(`🐘 Android app auth request (PostgreSQL): ${employeeId} with device ${deviceId}`);

    if (!employeeId || !deviceId) {
      return NextResponse.json(
        { error: 'Employee ID and Device ID are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    let employee = null;

    try {
      // Handle different employeeId formats
      if (employeeId === 'EMP001') {
        // Map EMP001 to the actual admin employee
        console.log('🔄 Mapping EMP001 to admin employee...');
        const query = `
          SELECT id, employee_id, first_name, last_name, name, email, phone
          FROM employees
          WHERE id = $1
        `;
        const result = await client.query(query, [1]);
        
        if (result.rows.length > 0) {
          employee = result.rows[0];
          console.log(`✅ Mapped EMP001 to: ${employee.employee_id} - ${employee.first_name} ${employee.last_name}`);
        }
      } else {
        // Try direct employee_id lookup
        console.log(`🔍 Looking up employee by employee_id: ${employeeId}`);
        const query = `
          SELECT id, employee_id, first_name, last_name, name, email, phone
          FROM employees
          WHERE employee_id = $1
        `;
        const result = await client.query(query, [employeeId]);
        
        if (result.rows.length > 0) {
          employee = result.rows[0];
        }
      }
    } finally {
      client.release();
    }

    if (!employee) {
      console.error('❌ Employee not found:', { employeeId });
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Employee authenticated from PostgreSQL: ${employee.employee_id} - ${employee.first_name} ${employee.last_name}`);

    // Return employee info for the Android app
    const employeeName = employee.name || `${employee.first_name} ${employee.last_name}`.trim();
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      employee: {
        id: employee.id,
        employeeId: employee.employee_id, // Return actual format like EMP-25-0001
        name: employeeName,
        email: employee.email || ''
      },
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Employee auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to list available employees (for testing/setup)
export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting employees list from PostgreSQL...');
    
    const client = await pool.connect();
    
    const query = `
      SELECT id, name, first_name, last_name, email, status
      FROM employees
      WHERE status IN ('active', 'Active', 'ACTIVE')
      ORDER BY 
        CASE 
          WHEN name IS NOT NULL AND name != '' THEN name
          WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
          ELSE 'Employee #' || id::text
        END
      LIMIT 20
    `;
    
    const result = await client.query(query);
    client.release();

    const formattedEmployees = result.rows.map(emp => ({
      id: emp.id,
      employeeId: `EMP${emp.id.toString().padStart(3, '0')}`,
      name: emp.name || (emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : `Employee #${emp.id}`),
      email: emp.email,
      status: emp.status
    }));

    console.log(`✅ Retrieved ${formattedEmployees.length} employees from PostgreSQL`);

    return NextResponse.json({
      success: true,
      employees: formattedEmployees,
      total: formattedEmployees.length,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching employees:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch employees',
      details: error.message
    }, { status: 500 });
  }
} 