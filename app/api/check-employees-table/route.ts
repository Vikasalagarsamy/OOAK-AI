import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [CHECK EMPLOYEES TABLE] Checking employees table via PostgreSQL...')
    
    // Get all employees to see the table structure
    const result = await query(`
      SELECT *
      FROM employees
      LIMIT 5
    `)

    const employees = result.rows

    console.log(`✅ [CHECK EMPLOYEES TABLE] Found ${employees.length} employees via PostgreSQL`)

    return NextResponse.json({
      success: true,
      employees: employees,
      count: employees.length,
      sample_structure: employees[0] ? Object.keys(employees[0]) : [],
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ [CHECK EMPLOYEES TABLE] Error checking employees table (PostgreSQL):', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: 'PostgreSQL'
    }, { status: 500 })
  }
} 