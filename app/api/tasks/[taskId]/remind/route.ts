import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { createClient } from '@/lib/postgresql-client'
import { NotificationService } from '@/lib/notification-service'

// POST /api/tasks/[taskId]/remind
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = parseInt(params.taskId)
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 })
    }

    console.log('🔔 Task Reminder API - Sending reminder for task:', taskId, 'by user:', currentUser.username)

    const { query, transaction } = createClient()

    // Get task details including the assigned user
    const { data: task, error: taskError } = await supabase
      .from('ai_tasks')
      .select(`
        id,
        task_title,
        task_description,
        priority,
        status,
        due_date,
        assigned_to,
        assigned_to_employee_id,
        created_at,
        metadata
      `)
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      console.error('❌ Task not found:', taskError)
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if task is still pending/in-progress (no point reminding about completed tasks)
    if (task.status === 'completed' || task.status === 'cancelled') {
      return NextResponse.json({ 
        error: `Cannot send reminder for ${task.status} task` 
      }, { status: 400 })
    }

    // Get the assigned user's details to send notification
    let assignedEmployeeId = task.assigned_to_employee_id
    
    if (!assignedEmployeeId) {
      return NextResponse.json({ 
        error: 'Task is not assigned to anyone' 
      }, { status: 400 })
    }

    // Look up the user account ID from the employee ID
    const { data: userAccount, error: userError } = await supabase
      .from('user_accounts')
      .select('id, username')
      .eq('employee_id', assignedEmployeeId)
      .eq('is_active', true)
      .single()

    if (userError || !userAccount) {
      console.error('❌ User account not found for employee:', assignedEmployeeId, userError)
      return NextResponse.json({ 
        error: `No active user account found for employee ID ${assignedEmployeeId}. The user may not have a login account yet.` 
      }, { status: 400 })
    }

    const targetUserId = userAccount.id
    console.log('🔍 Found user account:', { 
      employeeId: assignedEmployeeId, 
      userId: targetUserId, 
      userIdType: typeof targetUserId,
      username: userAccount.username 
    })

    // Determine urgency based on due date and current status
    const dueDate = new Date(task.due_date)
    const now = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
    let urgencyText = ''
    
    if (daysUntilDue < 0) {
      priority = 'urgent'
      urgencyText = `OVERDUE by ${Math.abs(daysUntilDue)} day(s)`
    } else if (daysUntilDue <= 1) {
      priority = 'high'
      urgencyText = daysUntilDue === 0 ? 'DUE TODAY' : 'DUE TOMORROW'
    } else if (daysUntilDue <= 3) {
      priority = 'medium'
      urgencyText = `Due in ${daysUntilDue} day(s)`
    } else {
      priority = 'low'
      urgencyText = `Due in ${daysUntilDue} day(s)`
    }

    // Create the reminder notification
    const notificationData = {
      user_id: targetUserId,
      type: 'client_followup' as const, // Using existing notification type
      priority,
      title: `🔔 Task Reminder: ${task.task_title}`,
      message: `${urgencyText} - ${task.task_description || 'Please check task details'}. Reminder sent by ${currentUser.username}.`,
      action_url: `/tasks/dashboard?focus=${taskId}`,
      action_label: 'View Task',
      metadata: {
        task_id: taskId,
        task_title: task.task_title,
        due_date: task.due_date,
        priority: task.priority,
        reminded_by: currentUser.id,
        reminded_by_username: currentUser.username,
        reminder_sent_at: new Date().toISOString(),
        days_until_due: daysUntilDue,
        task_status: task.status
      }
    }

    console.log('🔔 Creating reminder notification:', notificationData)

    // Send the notification
    const notificationId = await NotificationService.createNotification(notificationData)

    if (!notificationId) {
      return NextResponse.json({ 
        error: 'Failed to send reminder notification' 
      }, { status: 500 })
    }

    // Log the reminder action for audit purposes
    const { error: logError } = await supabase
      .from('ai_tasks')
      .update({
        metadata: {
          ...task.metadata,
          last_reminder_sent: new Date().toISOString(),
          reminded_by: currentUser.id,
          reminder_count: (task.metadata?.reminder_count || 0) + 1
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (logError) {
      console.warn('⚠️ Failed to update task reminder metadata:', logError)
    }

    console.log('✅ Task reminder sent successfully:', {
      taskId,
      assignedTo: task.assigned_to,
      notificationId,
      urgencyText
    })

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${task.assigned_to} (${userAccount.username})`,
      details: {
        task_title: task.task_title,
        assigned_to: task.assigned_to,
        username: userAccount.username,
        urgency: urgencyText,
        notification_id: notificationId,
        employee_id: assignedEmployeeId,
        user_id: targetUserId
      }
    })

  } catch (error) {
    console.error('❌ Error sending task reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send task reminder' },
      { status: 500 }
    )
  }
} 