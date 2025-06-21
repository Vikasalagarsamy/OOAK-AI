import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase')
    const { query, transaction } = createClient()
    
    // Get tasks with employee assignments
    const { data: tasks, error } = await supabase
      .from('ai_tasks')
      .select('id, task_title, assigned_to_employee_id, assigned_to')
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      tasks: tasks || [],
      summary: {
        totalTasks: tasks?.length || 0,
        tasksWithEmployeeId: tasks?.filter(t => t.assigned_to_employee_id).length || 0,
        uniqueEmployeeIds: [...new Set(tasks?.map(t => t.assigned_to_employee_id).filter(Boolean))]
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 