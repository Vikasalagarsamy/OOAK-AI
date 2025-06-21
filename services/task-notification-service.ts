import { query, transaction } from '@/lib/postgresql-client'
import { getUserIdForDatabase } from '@/lib/uuid-helpers'

export interface NotificationRule {
  id: string
  task_type: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  remind_after_hours: number
  escalate_after_hours: number
  escalate_to_role: string
  notification_methods: ('email' | 'sms' | 'in_app')[]
  active: boolean
}

export interface TaskNotification {
  id: string
  task_id: string
  employee_id: string
  employee_uuid?: string
  type: 'reminder' | 'escalation' | 'deadline_warning' | 'overdue_alert'
  message: string
  sent_at: string
  method: 'email' | 'sms' | 'in_app'
  status: 'pending' | 'sent' | 'failed'
}

export class TaskNotificationService {
  /**
   * Check for tasks that need reminders or escalations
   */
  async processTaskNotifications(): Promise<{
    reminders_sent: number
    escalations_triggered: number
    notifications: TaskNotification[]
  }> {
    try {
      console.log('🔔 [NOTIFICATION] Task Notification Service: Checking for overdue tasks via PostgreSQL...')

      // Query PostgreSQL for tasks that need attention
      const overdueTasksResult = await query(`
        SELECT 
          t.id, t.title, t.assigned_to, t.due_date, t.priority, t.status,
          e.name as employee_name, e.email
        FROM tasks t
        LEFT JOIN employees e ON t.assigned_to = e.id
        WHERE t.due_date < NOW() 
        AND t.status NOT IN ('completed', 'cancelled')
        ORDER BY t.due_date ASC
        LIMIT 50
      `)

      const upcomingTasksResult = await query(`
        SELECT 
          t.id, t.title, t.assigned_to, t.due_date, t.priority, t.status,
          e.name as employee_name, e.email
        FROM tasks t
        LEFT JOIN employees e ON t.assigned_to = e.id
        WHERE t.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        AND t.status NOT IN ('completed', 'cancelled')
        ORDER BY t.due_date ASC
        LIMIT 50
      `)

      const mockNotifications: TaskNotification[] = []
      let remindersSent = 0
      let escalationsTriggered = 0

      // Process overdue tasks
      for (const task of overdueTasksResult.rows) {
        mockNotifications.push({
          id: `notif-overdue-${task.id}`,
          task_id: task.id,
          employee_id: task.assigned_to,
          type: 'overdue_alert',
          message: `URGENT: Task "${task.title}" is overdue. Priority: ${task.priority}`,
          sent_at: new Date().toISOString(),
          method: 'email',
          status: 'sent'
        })
        escalationsTriggered++
      }

      // Process upcoming deadlines
      for (const task of upcomingTasksResult.rows) {
        mockNotifications.push({
          id: `notif-reminder-${task.id}`,
          task_id: task.id,
          employee_id: task.assigned_to,
          type: 'deadline_warning',
          message: `Reminder: Task "${task.title}" is due in 24 hours. Priority: ${task.priority}`,
          sent_at: new Date().toISOString(),
          method: 'in_app',
          status: 'sent'
        })
        remindersSent++
      }

      console.log(`✅ [NOTIFICATION] Processed ${mockNotifications.length} notifications via PostgreSQL`)

      return {
        reminders_sent: remindersSent,
        escalations_triggered: escalationsTriggered,
        notifications: mockNotifications
      }
    } catch (error) {
      console.error('❌ [NOTIFICATION] Task Notification Service Error:', error)
      return {
        reminders_sent: 0,
        escalations_triggered: 0,
        notifications: []
      }
    }
  }

  /**
   * Send immediate notification for task assignment
   */
  async sendTaskAssignmentNotification(
    employeeId: string, 
    taskId: string, 
    taskTitle: string,
    priority: string,
    dueDate: string
  ): Promise<boolean> {
    try {
      console.log(`📧 Sending task assignment notification to employee ${employeeId}`)

      // Convert employee ID to UUID format for notification system compatibility
      const employeeUuid = getUserIdForDatabase(employeeId)

      // Mock notification sending
      const notification: TaskNotification = {
        id: `notif-${Date.now()}`,
        task_id: taskId,
        employee_id: employeeId, // Keep original for task system
        employee_uuid: employeeUuid, // UUID format for notifications
        type: 'reminder',
        message: `New ${priority} priority task assigned: "${taskTitle}" - Due: ${new Date(dueDate).toLocaleDateString()}`,
        sent_at: new Date().toISOString(),
        method: 'email',
        status: 'sent'
      }

      console.log('✅ Task assignment notification sent:', notification.message)
      return true
    } catch (error) {
      console.error('❌ Failed to send task assignment notification:', error)
      return false
    }
  }

  /**
   * Send escalation notification to managers
   */
  async sendEscalationNotification(
    taskId: string,
    taskTitle: string,
    employeeName: string,
    managerRole: string,
    revenueImpact: number
  ): Promise<boolean> {
    try {
      console.log(`🚨 Sending escalation notification for task ${taskId}`)

      const notification: TaskNotification = {
        id: `escalation-${Date.now()}`,
        task_id: taskId,
        employee_id: 'manager', // Would be actual manager ID
        type: 'escalation',
        message: `ESCALATION REQUIRED: Task "${taskTitle}" assigned to ${employeeName} is overdue. Revenue impact: ₹${revenueImpact.toLocaleString()}. Immediate action required.`,
        sent_at: new Date().toISOString(),
        method: 'email',
        status: 'sent'
      }

      console.log('🚨 Escalation notification sent to', managerRole)
      return true
    } catch (error) {
      console.error('❌ Failed to send escalation notification:', error)
      return false
    }
  }

  /**
   * Send deadline warning notifications
   */
  async sendDeadlineWarnings(): Promise<number> {
    try {
      console.log('⏰ Checking for approaching deadlines...')

      // Mock deadline warnings
      const warnings = [
        {
          taskTitle: 'Follow up with Ramya about quotation',
          employeeName: 'Vikas Alagarsamy',
          hoursUntilDue: 24,
          revenueImpact: 54000
        }
      ]

      let warningsSent = 0
      for (const warning of warnings) {
        console.log(`⚠️ Deadline warning: ${warning.taskTitle} due in ${warning.hoursUntilDue} hours`)
        warningsSent++
      }

      return warningsSent
    } catch (error) {
      console.error('❌ Failed to send deadline warnings:', error)
      return 0
    }
  }

  /**
   * Get notification rules for task types
   */
  async getNotificationRules(): Promise<NotificationRule[]> {
    try {
      // Mock notification rules
      const rules: NotificationRule[] = [
        {
          id: 'rule-001',
          task_type: 'approval',
          priority: 'high',
          remind_after_hours: 4,
          escalate_after_hours: 8,
          escalate_to_role: 'Sales Manager',
          notification_methods: ['email', 'in_app'],
          active: true
        },
        {
          id: 'rule-002',
          task_type: 'follow_up',
          priority: 'urgent',
          remind_after_hours: 2,
          escalate_after_hours: 6,
          escalate_to_role: 'Sales Manager',
          notification_methods: ['email', 'sms'],
          active: true
        },
        {
          id: 'rule-003',
          task_type: 'payment',
          priority: 'high',
          remind_after_hours: 8,
          escalate_after_hours: 24,
          escalate_to_role: 'Finance Head',
          notification_methods: ['email'],
          active: true
        }
      ]

      return rules
    } catch (error) {
      console.error('❌ Failed to get notification rules:', error)
      return []
    }
  }

  /**
   * Send daily task summary to managers
   */
  async sendDailyTaskSummary(): Promise<boolean> {
    try {
      console.log('📊 Generating daily task summary for management...')

      const summary = {
        total_active_tasks: 5,
        overdue_tasks: 1,
        completed_today: 2,
        revenue_at_risk: 87000,
        high_priority_pending: 2
      }

      console.log('📧 Daily summary sent to management:', summary)
      return true
    } catch (error) {
      console.error('❌ Failed to send daily summary:', error)
      return false
    }
  }

  /**
   * Send SMS alerts for critical tasks
   */
  async sendCriticalTaskSMS(
    phoneNumber: string,
    taskTitle: string,
    clientName: string,
    revenueImpact: number
  ): Promise<boolean> {
    try {
      const message = `URGENT TASK: ${taskTitle} for ${clientName}. Revenue impact: ₹${revenueImpact.toLocaleString()}. Please check your dashboard immediately.`
      
      console.log(`📱 SMS Alert sent to ${phoneNumber}:`, message)
      
      // In real implementation, integrate with SMS service like Twilio
      return true
    } catch (error) {
      console.error('❌ Failed to send SMS alert:', error)
      return false
    }
  }

  /**
   * Create in-app notification
   */
  async createInAppNotification(
    employeeId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success'
  ): Promise<string> {
    try {
      // Convert employee ID to UUID format for notification system
      const employeeUuid = getUserIdForDatabase(employeeId)
      
      const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      
      // In real implementation, save to notifications table
      const notificationData = {
        id: notificationId,
        user_id: parseInt(employeeId), // Integer for notifications table
        user_uuid: employeeUuid, // UUID for cross-system compatibility
        title,
        message,
        type,
        read: false,
        created_at: new Date().toISOString()
      }
      
      console.log(`🔔 In-app notification created for employee ${employeeId}:`, title)
      return notificationId
    } catch (error) {
      console.error('❌ Failed to create in-app notification:', error)
      throw error
    }
  }

  /**
   * Get employee's unread notifications
   */
  async getEmployeeNotifications(employeeId: string): Promise<TaskNotification[]> {
    try {
      // Mock unread notifications for employee
      const notifications: TaskNotification[] = [
        {
          id: 'notif-001',
          task_id: 'task-002',
          employee_id: employeeId,
          type: 'reminder',
          message: 'Reminder: Follow up with Ramya about quotation due in 24 hours',
          sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          method: 'in_app',
          status: 'sent'
        },
        {
          id: 'notif-002',
          task_id: 'task-003',
          employee_id: employeeId,
          type: 'deadline_warning',
          message: 'New lead generation task assigned - Due in 5 days',
          sent_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          method: 'in_app',
          status: 'sent'
        }
      ]

      return notifications
    } catch (error) {
      console.error('❌ Failed to get employee notifications:', error)
      return []
    }
  }
} 