import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client-unified'

export async function GET(request: NextRequest) {
  try {
    // Use service key for admin access (bypassing auth)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, serviceKey)

    // Get all employees to see the data structure
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name, name, email, phone')
      .limit(10)

    if (error) {
      console.error('Employee query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Test specific lookups for employee ID 6
    const { data: emp6, error: emp6Error } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name, name, email, phone')
      .eq('id', 6)
      .single()

    const { data: empEMP006, error: empEMP006Error } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name, name, email, phone')
      .eq('employee_id', 'EMP006')
      .single()

    return NextResponse.json({
      allEmployees: employees,
      lookupById6: { data: emp6, error: emp6Error?.message },
      lookupByEmployeeId: { data: empEMP006, error: empEMP006Error?.message },
      totalEmployees: employees?.length || 0
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 