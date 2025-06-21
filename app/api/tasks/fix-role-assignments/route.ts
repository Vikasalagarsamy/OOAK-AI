import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    console.log('🔄 Starting role assignment fix...')
    
    // First, find the Sales Head employee ID
    const { data: salesHeadEmployees, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, job_title')
      .ilike('job_title', '%sales head%')

    if (employeeError) {
      throw new Error(`Failed to fetch Sales Head: ${employeeError.message}`)
    }

    // If no Sales Head found, try to find Sales Manager or similar
    let salesHeadEmployee = null
    if (salesHeadEmployees && salesHeadEmployees.length > 0) {
      salesHeadEmployee = salesHeadEmployees[0]
    } else {
      // Fallback to any sales management role
      const { data: fallbackEmployees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, job_title')
        .ilike('job_title', '%manager%')
        .limit(1)
      
      if (fallbackEmployees && fallbackEmployees.length > 0) {
        salesHeadEmployee = fallbackEmployees[0]
        console.log(`⚠️ Using fallback manager: ${salesHeadEmployee.first_name} ${salesHeadEmployee.last_name}`)
      }
    }

    if (!salesHeadEmployee) {
      return NextResponse.json({
        success: false,
        error: 'No Sales Head employee found',
        message: 'Cannot assign quotation approval tasks without a Sales Head'
      }, { status: 400 })
    }

    console.log(`🎯 Found Sales Head: ${salesHeadEmployee.first_name} ${salesHeadEmployee.last_name} (ID: ${salesHeadEmployee.id})`)

    // Get all quotation approval tasks
    const { data: approvalTasks, error: tasksError } = await supabase
      .from('ai_tasks')
      .select('id, task_title, assigned_to_employee_id, task_type, status')
      .eq('task_type', 'quotation_approval')

    if (tasksError) {
      throw new Error(`Failed to fetch approval tasks: ${tasksError.message}`)
    }

    if (!approvalTasks || approvalTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No quotation approval tasks found',
        reassigned: 0
      })
    }

    let reassignedCount = 0
    const updates = []

    for (const task of approvalTasks) {
      // Check if task needs reassignment
      if (task.assigned_to_employee_id !== salesHeadEmployee.id && task.status === 'pending') {
        console.log(`🔄 Reassigning task ${task.id} to Sales Head`)
        
        const { error: updateError } = await supabase
          .from('ai_tasks')
          .update({
            assigned_to_employee_id: salesHeadEmployee.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)

        if (updateError) {
          console.error(`❌ Failed to reassign task ${task.id}:`, updateError)
          updates.push({
            taskId: task.id,
            status: 'error',
            error: updateError.message
          })
        } else {
          reassignedCount++
          updates.push({
            taskId: task.id,
            status: 'reassigned',
            oldAssignee: task.assigned_to_employee_id,
            newAssignee: salesHeadEmployee.id
          })
        }
      } else {
        updates.push({
          taskId: task.id,
          status: task.assigned_to_employee_id === salesHeadEmployee.id ? 'already_assigned_correctly' : 'completed_task_skipped'
        })
      }
    }

    console.log(`✅ Role assignment fix completed. Reassigned ${reassignedCount} tasks.`)

    return NextResponse.json({
      success: true,
      message: `Successfully reassigned ${reassignedCount} quotation approval tasks to Sales Head`,
      reassigned: reassignedCount,
      total_checked: approvalTasks.length,
      sales_head: {
        id: salesHeadEmployee.id,
        name: `${salesHeadEmployee.first_name} ${salesHeadEmployee.last_name}`,
        title: salesHeadEmployee.job_title
      },
      details: updates
    })

  } catch (error: any) {
    console.error('❌ Error fixing role assignments:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to fix role assignments'
      },
      { status: 500 }
    )
  }
} 