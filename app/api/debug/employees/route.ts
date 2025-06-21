import { NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-unified'

/**
 * 🔍 DEBUG EMPLOYEES API
 * 
 * This endpoint shows all employees in the database
 * to help debug task assignment issues
 */

export async function GET() {
  try {
    const { query, transaction } = createClient()

    // Get all employees
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, first_name, last_name, job_title, department_id, designation_id, status')
      .order('id')

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Find any employee that matches "Sridhar"
    const sridharEmployees = employees?.filter(emp => 
      emp.name?.toLowerCase().includes('sridhar') ||
      emp.first_name?.toLowerCase().includes('sridhar') ||
      emp.last_name?.toLowerCase().includes('sridhar')
    ) || []

    return NextResponse.json({
      success: true,
      totalEmployees: employees?.length || 0,
      employees: employees || [],
      sridharEmployees,
      debug: {
        message: 'Showing all employees and filtering for Sridhar matches',
        sridharMatches: sridharEmployees.length
      }
    })

  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 