import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Debug team performance request (PostgreSQL)')
    
    const client = await pool.connect()
    
    try {
      // Get employees (use department_id instead of department)
      const employeesQuery = `
        SELECT id, name, email, department_id
        FROM employees
        WHERE department_id = $1
      `
      const employeesResult = await client.query(employeesQuery, [2]) // Sales department ID
      const employees = employeesResult.rows

      // Get quotations
      const quotationsQuery = `
        SELECT id, quotation_number, client_name, total_amount, status, created_by
        FROM quotations
      `
      const quotationsResult = await client.query(quotationsQuery)
      const quotations = quotationsResult.rows

      // Get leads
      const leadsQuery = `
        SELECT id, client_name, assigned_to, status
        FROM leads
      `
      const leadsResult = await client.query(leadsQuery)
      const leads = leadsResult.rows

      console.log(`✅ Retrieved team performance data from PostgreSQL: ${employees.length} employees, ${quotations.length} quotations, ${leads.length} leads`)

      const debug = {
        employees: employees?.map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          department_id: emp.department_id
        })) || [],
        quotations: quotations?.map((q: any) => ({
          id: q.id,
          quotation_number: q.quotation_number,
          client_name: q.client_name,
          total_amount: q.total_amount,
          status: q.status,
          created_by: q.created_by  // Only use created_by since assigned_to doesn't exist
        })) || [],
        leads: leads?.map((l: any) => ({
          id: l.id,
          client_name: l.client_name,
          assigned_to: l.assigned_to,
          status: l.status
        })) || [],
        analysis: {
          vikas_employee_id: employees?.find((e: any) => e.name === 'Vikas Alagarsamy')?.id,
          jothi_quotation: quotations?.find((q: any) => q.client_name === 'Jothi Alagarsamy'),
          vikas_uuid: "87000000-0000-0000-0000-000000000000",
          assignment_issue: "Check if quotation.created_by matches Vikas's UUID"
        }
      }

      return NextResponse.json({
        success: true,
        debug,
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })
      
    } finally {
      client.release()
    }
    
  } catch (error: any) {
    console.error('❌ Error debugging team performance:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error.message
    }, { status: 500 })
  }
} 