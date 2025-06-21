import { NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: Request) {
  try {
    console.log('🐘 Getting employees data from PostgreSQL...')
    const user = await getCurrentUser()
    
    // Get all employees with correct column names
    const query = `
      SELECT 
        id,
        name,
        first_name,
        last_name,
        email,
        phone,
        created_at,
        status
      FROM employees
      ORDER BY name ASC
    `

    const client = await pool.connect()
    const result = await client.query(query)
    client.release()

    console.log(`✅ Employees data from PostgreSQL: ${result.rows.length} employees`)

    // Enrich employee data with computed full name
    const enrichedEmployees = result.rows?.map(emp => ({
      ...emp,
      display_name: emp.name || (emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : `Employee #${emp.id}`),
      position: 'Employee'
    })) || []

    return NextResponse.json({
      success: true,
      data: enrichedEmployees,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        total: enrichedEmployees.length
      }
    })

  } catch (error: any) {
    console.error('Employees API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch employees'
    }, { status: 500 })
  }
} 