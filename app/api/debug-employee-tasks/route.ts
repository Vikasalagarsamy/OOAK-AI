import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase')
    const { query, transaction } = createClient()
    
    // Get unique employee IDs that have tasks assigned
    const { data: taskEmployees, error: taskError } = await supabase
      .from('ai_tasks')
      .select('assigned_to_employee_id')
      .not('assigned_to_employee_id', 'is', null)
      .limit(50)

    if (taskError) {
      return NextResponse.json({ error: 'Task query failed', details: taskError })
    }

    // Get all employees
    const { data: allEmployees, error: empError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, username, email')
      .limit(20)

    if (empError) {
      return NextResponse.json({ error: 'Employee query failed', details: empError })
    }

    // Get count of tasks per employee
    const employeeCounts = {}
    taskEmployees?.forEach(task => {
      const empId = task.assigned_to_employee_id
      if (empId) {
        employeeCounts[empId] = (employeeCounts[empId] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      totalTasks: taskEmployees?.length || 0,
      totalEmployees: allEmployees?.length || 0,
      employeeTaskCounts: employeeCounts,
      uniqueEmployeeIds: [...new Set(taskEmployees?.map(t => t.assigned_to_employee_id))],
      sampleEmployees: allEmployees?.slice(0, 10) || []
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Debug failed', details: error.message }, { status: 500 })
  }
} 