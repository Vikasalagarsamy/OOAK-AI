import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-server'

export async function GET(request: NextRequest) {
  try {
    const { query, transaction } = createClient()

    console.log('🔍 Testing simple employee fetch...')

    // Get all active employees without any complex filtering
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name, status')
      .eq('status', 'active')
      .limit(10)

    if (error) {
      console.error('❌ Error fetching employees:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch employees', 
        details: error,
        success: false 
      }, { status: 500 })
    }

    console.log(`✅ Found ${employees.length} active employees`)
    
    // Format for dropdown
    const formattedEmployees = employees.map(emp => ({
      id: emp.id,
      employee_id: emp.employee_id,
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      full_name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      first_name: emp.first_name,
      last_name: emp.last_name,
      status: emp.status
    }))

    return NextResponse.json({
      success: true,
      employees: formattedEmployees,
      count: employees.length,
      message: `Found ${employees.length} active employees`
    })

  } catch (error) {
    console.error('❌ Exception in simple employee test:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error,
      success: false 
    }, { status: 500 })
  }
} 