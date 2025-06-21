// 🎯 MIGRATED: AI Task Management Service - PostgreSQL Version
// Original: services/ai-task-management-service.ts (Supabase)
// Migrated: Direct PostgreSQL queries for intelligent task management

import { query, transaction } from "@/lib/postgresql-client"
import { AIBusinessIntelligenceService, ComprehensiveBusinessData } from './ai-business-intelligence-service'
import { getUserIdForDatabase } from '@/lib/uuid-helpers'
import type { LeadStatus } from '@/types/follow-up'

export interface AITask {
  id?: string
  title: string
  description: string
  task_type: 'quotation_follow_up' | 'quotation_approval' | 'lead_follow_up' | 'payment_follow_up' | 'client_meeting' | 'document_review' | 'contract_preparation' | 'delivery_coordination' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'
  assigned_to_employee_id?: number
  quotation_id?: number
  lead_id?: string
  client_name?: string
  due_date: string
  estimated_duration_minutes: number
  business_impact: 'low' | 'medium' | 'high' | 'critical'
  estimated_value?: number
  ai_reasoning: string
  ai_confidence_score: number
}

export interface TaskRule {
  rule_name: string
  trigger_condition: any
  task_template: any
  assignment_logic: any
  priority_calculation?: any
}

export interface TaskPerformance {
  employee_id: number
  employee_name: string
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  avg_completion_time: number
  overdue_tasks: number
  revenue_impact: number
}

export class AITaskManagementService {
  private biService = new AIBusinessIntelligenceService()

  /**
   * Main AI Task Generation Engine
   * Analyzes business data and automatically creates tasks
   */
  async generateAITasks(): Promise<{ tasksCreated: number; tasks: AITask[] }> {
    try {
      console.log("🤖 AI Task Generator: Starting intelligent task analysis with PostgreSQL...")

      // 1. Get comprehensive business data
      const businessData = await this.biService.getComprehensiveBusinessData()

      // 2. Get active task rules
      const rules = await this.getActiveTaskRules()

      // 3. Analyze data and generate tasks
      const generatedTasks: AITask[] = []

      for (const rule of rules) {
        const tasks = await this.evaluateRule(rule, businessData)
        generatedTasks.push(...tasks)
      }

      // 4. Remove duplicates and prioritize
      const uniqueTasks = this.deduplicateAndPrioritize(generatedTasks)

      // 5. Save tasks to database
      const savedTasks = await this.saveTasks(uniqueTasks)

      // 6. Generate reminders
      await this.generateReminders(savedTasks)

      console.log(`🎯 AI Task Generator: Created ${savedTasks.length} intelligent tasks`)

      return {
        tasksCreated: savedTasks.length,
        tasks: savedTasks
      }
    } catch (error) {
      console.error("❌ AI Task Generation Error:", error)
      return { tasksCreated: 0, tasks: [] }
    }
  }

  /**
   * Evaluate a specific rule against business data
   */
  private async evaluateRule(rule: TaskRule, businessData: ComprehensiveBusinessData): Promise<AITask[]> {
    const tasks: AITask[] = []

    try {
      switch (rule.rule_name) {
        case 'quotation_follow_up_rule':
          tasks.push(...await this.generateQuotationFollowUpTasks(businessData))
          break
        case 'quotation_approval_rule':
          tasks.push(...await this.generateQuotationApprovalTasks(businessData))
          break
        case 'payment_follow_up_rule':
          tasks.push(...await this.generatePaymentFollowUpTasks(businessData))
          break
        default:
          console.log(`⚠️ Unknown rule: ${rule.rule_name}`)
      }
    } catch (error) {
      console.error(`❌ Error evaluating rule ${rule.rule_name}:`, error)
    }

    return tasks
  }

  /**
   * Generate quotation follow-up tasks
   */
  private async generateQuotationFollowUpTasks(businessData: ComprehensiveBusinessData): Promise<AITask[]> {
    const tasks: AITask[] = []

    // Find quotations that need follow-up
    const sentQuotations = businessData.sales.quotationDetails.filter(q => 
      q.status === 'sent' || q.status === 'pending_approval'
    )

    for (const quotation of sentQuotations) {
      const daysSinceSent = Math.floor(
        (new Date().getTime() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceSent >= 3) {
        // Check if task already exists
        const existingTask = await this.checkExistingTask('quotation_follow_up', quotation.id)
        
        if (!existingTask) {
          const assignedEmployee = await this.smartAssignment('quotation_follow_up', quotation)
          
          tasks.push({
            title: `Follow up with ${quotation.client_name} about quotation`,
            description: `Contact ${quotation.client_name} regarding the ₹${quotation.total_amount.toLocaleString()} quotation sent ${daysSinceSent} days ago. Check their interest and address any concerns.`,
            task_type: 'quotation_follow_up',
            priority: this.calculatePriority(quotation.total_amount, daysSinceSent),
            status: 'pending',
            assigned_to_employee_id: assignedEmployee?.id,
            quotation_id: parseInt(quotation.id),
            client_name: quotation.client_name,
            due_date: this.calculateDueDate(2), // Due in 2 days
            estimated_duration_minutes: 30,
            business_impact: this.calculateBusinessImpact(quotation.total_amount),
            estimated_value: quotation.total_amount,
            ai_reasoning: `Quotation sent ${daysSinceSent} days ago without response. High-value client (₹${quotation.total_amount.toLocaleString()}) requires immediate attention to maintain engagement.`,
            ai_confidence_score: 0.9
          })
        }
      }
    }

    return tasks
  }

  /**
   * Generate quotation approval tasks
   */
  private async generateQuotationApprovalTasks(businessData: ComprehensiveBusinessData): Promise<AITask[]> {
    const tasks: AITask[] = []

    // Find draft quotations that need approval
    const draftQuotations = businessData.sales.quotationDetails.filter(q => 
      q.status === 'draft'
    )

    for (const quotation of draftQuotations) {
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceCreated >= 1) {
        const existingTask = await this.checkExistingTask('quotation_approval', quotation.id)
        
        if (!existingTask) {
          const assignedEmployee = await this.smartAssignment('quotation_approval', quotation)
          
          tasks.push({
            title: `Review and approve quotation for ${quotation.client_name}`,
            description: `Review the ₹${quotation.total_amount.toLocaleString()} quotation for ${quotation.client_name} and approve for sending. Verify pricing, terms, and deliverables.`,
            task_type: 'quotation_approval',
            priority: 'medium',
            status: 'pending',
            assigned_to_employee_id: assignedEmployee?.id,
            quotation_id: parseInt(quotation.id),
            client_name: quotation.client_name,
            due_date: this.calculateDueDate(1), // Due tomorrow
            estimated_duration_minutes: 15,
            business_impact: this.calculateBusinessImpact(quotation.total_amount),
            estimated_value: quotation.total_amount,
            ai_reasoning: `Draft quotation pending approval for ${daysSinceCreated} days. Quick approval needed to maintain sales momentum.`,
            ai_confidence_score: 0.85
          })
        }
      }
    }

    return tasks
  }

  /**
   * Generate payment follow-up tasks
   */
  private async generatePaymentFollowUpTasks(businessData: ComprehensiveBusinessData): Promise<AITask[]> {
    const tasks: AITask[] = []

    // Find approved quotations that need payment follow-up
    const approvedQuotations = businessData.sales.quotationDetails.filter(q => 
      q.status === 'approved'
    )

    for (const quotation of approvedQuotations) {
      const daysSinceApproval = Math.floor(
        (new Date().getTime() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceApproval >= 7) {
        const existingTask = await this.checkExistingTask('payment_follow_up', quotation.id)
        
        if (!existingTask) {
          const assignedEmployee = await this.smartAssignment('payment_follow_up', quotation)
          
          tasks.push({
            title: `Follow up on payment from ${quotation.client_name}`,
            description: `Contact ${quotation.client_name} regarding payment for the approved ₹${quotation.total_amount.toLocaleString()} quotation. Send invoice if needed and confirm payment timeline.`,
            task_type: 'payment_follow_up',
            priority: 'high',
            status: 'pending',
            assigned_to_employee_id: assignedEmployee?.id,
            quotation_id: parseInt(quotation.id),
            client_name: quotation.client_name,
            due_date: this.calculateDueDate(1), // Due tomorrow
            estimated_duration_minutes: 20,
            business_impact: 'high',
            estimated_value: quotation.total_amount,
            ai_reasoning: `Payment pending for ${daysSinceApproval} days on approved quotation. Critical for cash flow and client relationship.`,
            ai_confidence_score: 0.95
          })
        }
      }
    }

    return tasks
  }

  /**
   * Smart assignment logic based on employee roles and workload
   */
  private async smartAssignment(taskType: string, context: any): Promise<{ id: number; name: string } | null> {
    try {
      console.log(`🎯 Smart assignment for task type: ${taskType}`)

      // Get employees with their current workload from PostgreSQL
      const employeesResult = await query(`
        SELECT 
          e.id, 
          e.first_name, 
          e.last_name, 
          e.job_title,
          d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.is_active = true
        ORDER BY e.created_at ASC
      `)

      const employees = employeesResult.rows

      if (!employees || employees.length === 0) {
        console.warn('⚠️ No active employees found for task assignment')
        return null
      }

      // Assignment logic based on task type
      switch (taskType) {
        case 'quotation_follow_up':
        case 'payment_follow_up':
          // Prefer Sales Head, fallback to any sales member
          return this.findBestEmployee(employees, ['SALES HEAD', 'SEO'], 'Sales')
        
        case 'quotation_approval':
          // ONLY assign to Sales Head - quotation approvals should not go to sales resources
          return this.findBestEmployee(employees, ['Sales Head', 'SALES HEAD'], 'Sales')
        
        default:
          return employees && employees.length > 0 ? {
            id: employees[0].id,
            name: `${employees[0].first_name} ${employees[0].last_name}`
          } : null
      }
    } catch (error) {
      console.error('❌ Error in smart assignment:', error)
      return null
    }
  }

  /**
   * Find best employee based on job title and department
   */
  private findBestEmployee(employees: any[], preferredTitles: string[], fallbackDepartment: string): { id: number; name: string } | null {
    if (!employees || employees.length === 0) return null

    // First try preferred job titles (exact matches)
    for (const title of preferredTitles) {
      const employee = employees.find(emp => 
        emp.job_title?.toUpperCase().includes(title.toUpperCase())
      )
      if (employee) {
        console.log(`✅ Assigned to ${employee.first_name} ${employee.last_name} (${employee.job_title})`)
        return {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`
        }
      }
    }

    // For quotation approval tasks, don't fall back to department - only exact role matches
    if (preferredTitles.some(title => title.toLowerCase().includes('sales head'))) {
      console.warn('⚠️ No Sales Head found for quotation approval task - task will not be assigned')
      return null
    }

    // Fallback to department for other task types
    const employee = employees.find(emp => 
      emp.department_name === fallbackDepartment
    )
    
    if (employee) {
      console.log(`✅ Assigned to ${employee.first_name} ${employee.last_name} (${employee.department_name})`)
      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`
      }
    }

    // Final fallback to first employee (except for approval tasks)
    if (!preferredTitles.some(title => title.toLowerCase().includes('head'))) {
      console.log(`✅ Assigned to ${employees[0].first_name} ${employees[0].last_name} (default)`)
      return {
        id: employees[0].id,
        name: `${employees[0].first_name} ${employees[0].last_name}`
      }
    }

    return null
  }

  /**
   * Calculate task priority based on value and urgency
   */
  private calculatePriority(value: number, daysSince: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (value > 50000 && daysSince > 5) return 'urgent'
    if (value > 50000 || daysSince > 3) return 'high'
    if (value > 25000 || daysSince > 1) return 'medium'
    return 'low'
  }

  /**
   * Calculate business impact based on quotation value
   */
  private calculateBusinessImpact(value: number): 'low' | 'medium' | 'high' | 'critical' {
    if (value > 75000) return 'critical'
    if (value > 50000) return 'high'
    if (value > 25000) return 'medium'
    return 'low'
  }

  /**
   * Calculate due date
   */
  private calculateDueDate(daysFromNow: number): string {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysFromNow)
    return dueDate.toISOString()
  }

  /**
   * Check if task already exists using PostgreSQL
   */
  private async checkExistingTask(taskType: string, quotationId: string): Promise<boolean> {
    try {
      const result = await query(`
        SELECT id 
        FROM ai_tasks 
        WHERE task_type = $1 
        AND quotation_id = $2 
        AND status = 'pending'
        LIMIT 1
      `, [taskType, quotationId])

      return result.rows.length > 0
    } catch (error) {
      console.error('❌ Error checking existing task:', error)
      return false
    }
  }

  /**
   * Remove duplicate tasks and prioritize
   */
  private deduplicateAndPrioritize(tasks: AITask[]): AITask[] {
    const uniqueTasks = new Map<string, AITask>()

    for (const task of tasks) {
      const key = `${task.task_type}-${task.quotation_id}-${task.client_name}`
      
      if (!uniqueTasks.has(key) || 
          this.comparePriority(task.priority, uniqueTasks.get(key)!.priority) > 0) {
        uniqueTasks.set(key, task)
      }
    }

    return Array.from(uniqueTasks.values())
      .sort((a, b) => this.comparePriority(b.priority, a.priority))
  }

  /**
   * Compare task priorities
   */
  private comparePriority(a: string, b: string): number {
    const priorities = { urgent: 4, high: 3, medium: 2, low: 1 }
    return priorities[a as keyof typeof priorities] - priorities[b as keyof typeof priorities]
  }

  /**
   * Save tasks to PostgreSQL database
   */
  private async saveTasks(tasks: AITask[]): Promise<AITask[]> {
    try {
      console.log(`💾 Saving ${tasks.length} tasks to PostgreSQL...`)

      const savedTasks: AITask[] = []

      // Use transaction for atomicity
      await transaction(async (client) => {
        for (const task of tasks) {
          const result = await client.query(`
            INSERT INTO ai_tasks (
              task_title,
              task_description,
              task_type,
              priority,
              status,
              assigned_to_employee_id,
              quotation_id,
              client_name,
              due_date,
              estimated_duration_minutes,
              business_impact,
              estimated_value,
              ai_reasoning,
              ai_confidence_score,
              created_at,
              updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
            ) RETURNING *
          `, [
            task.title,
            task.description,
            task.task_type,
            task.priority,
            task.status,
            task.assigned_to_employee_id,
            task.quotation_id,
            task.client_name,
            task.due_date,
            task.estimated_duration_minutes,
            task.business_impact,
            task.estimated_value,
            task.ai_reasoning,
            task.ai_confidence_score,
            new Date().toISOString(),
            new Date().toISOString()
          ])

          if (result.rows[0]) {
            savedTasks.push({
              id: result.rows[0].id,
              ...task
            })
          }
        }
      })

      console.log(`✅ Successfully saved ${savedTasks.length} tasks to PostgreSQL`)
      return savedTasks

    } catch (error) {
      console.error('❌ Error saving tasks to PostgreSQL:', error)
      return []
    }
  }

  /**
   * Generate reminders for tasks using PostgreSQL
   */
  private async generateReminders(tasks: AITask[]): Promise<void> {
    try {
      console.log(`📅 Generating reminders for ${tasks.length} tasks...`)

      const reminders: Array<{
        task_id: string
        reminder_type: string
        scheduled_at: string
        notification_channel: string
        recipient_employee_id: number | undefined
        recipient_user_id: string | null
        message_template: string
      }> = []

      for (const task of tasks) {
        if (!task.id) continue

        // Create reminder 1 day before due date
        const reminderDate = new Date(task.due_date)
        reminderDate.setDate(reminderDate.getDate() - 1)

        // Convert employee ID to UUID format if needed for notifications
        const employeeUuid = task.assigned_to_employee_id ? getUserIdForDatabase(task.assigned_to_employee_id) : null

        reminders.push({
          task_id: task.id,
          reminder_type: 'due_soon',
          scheduled_at: reminderDate.toISOString(),
          notification_channel: 'in_app',
          recipient_employee_id: task.assigned_to_employee_id, // Keep as integer for task system
          recipient_user_id: employeeUuid, // UUID format for notifications
          message_template: `Reminder: Task "${task.title}" is due tomorrow`
        })

        // Create overdue reminder for due date
        reminders.push({
          task_id: task.id,
          reminder_type: 'overdue',
          scheduled_at: task.due_date,
          notification_channel: 'in_app',
          recipient_employee_id: task.assigned_to_employee_id, // Keep as integer for task system
          recipient_user_id: employeeUuid, // UUID format for notifications
          message_template: `OVERDUE: Task "${task.title}" is now overdue`
        })
      }

      // Insert reminders into PostgreSQL
      if (reminders.length > 0) {
        await transaction(async (client) => {
          for (const reminder of reminders) {
            await client.query(`
              INSERT INTO task_reminders (
                task_id,
                reminder_type,
                scheduled_at,
                notification_channel,
                recipient_employee_id,
                recipient_user_id,
                message_template,
                created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              reminder.task_id,
              reminder.reminder_type,
              reminder.scheduled_at,
              reminder.notification_channel,
              reminder.recipient_employee_id,
              reminder.recipient_user_id,
              reminder.message_template,
              new Date().toISOString()
            ])
          }
        })

        console.log(`✅ Generated ${reminders.length} reminders in PostgreSQL`)
      }

    } catch (error) {
      console.error('❌ Error creating reminders in PostgreSQL:', error)
    }
  }

  /**
   * Get active task rules from PostgreSQL
   */
  private async getActiveTaskRules(): Promise<TaskRule[]> {
    try {
      const result = await query(`
        SELECT * 
        FROM ai_task_rules 
        WHERE is_active = true 
        ORDER BY priority DESC
      `)

      return result.rows || []
    } catch (error) {
      console.error('❌ Error fetching task rules from PostgreSQL:', error)
      return []
    }
  }

  /**
   * Get tasks for a specific employee from PostgreSQL
   */
  async getEmployeeTasks(employeeId: number): Promise<AITask[]> {
    try {
      console.log(`📋 Fetching tasks for employee ${employeeId} from PostgreSQL...`)

      const result = await query(`
        SELECT 
          t.*,
          t.task_title as title,
          t.task_description as description
        FROM ai_tasks t
        WHERE t.assigned_to_employee_id = $1
        ORDER BY 
          CASE t.priority 
            WHEN 'urgent' THEN 4
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 1
            ELSE 0
          END DESC,
          t.due_date ASC
      `, [employeeId])

      console.log(`✅ Found ${result.rows.length} tasks for employee ${employeeId}`)
      return result.rows || []
    } catch (error) {
      console.error('❌ Error fetching employee tasks from PostgreSQL:', error)
      return []
    }
  }

  /**
   * Update task status in PostgreSQL
   */
  async updateTaskStatus(taskId: string, status: string, completionNotes?: string): Promise<boolean> {
    try {
      console.log(`📝 Updating task ${taskId} status to ${status}`)

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.completion_notes = completionNotes
      }

      let updateQuery = `
        UPDATE ai_tasks 
        SET status = $1, updated_at = $2`
      let queryParams = [status, updateData.updated_at]

      if (status === 'completed') {
        updateQuery += `, completed_at = $3, completion_notes = $4`
        queryParams.push(updateData.completed_at, completionNotes || null)
        updateQuery += ` WHERE id = $5`
        queryParams.push(taskId)
      } else {
        updateQuery += ` WHERE id = $3`
        queryParams.push(taskId)
      }

      const result = await query(updateQuery, queryParams)

      console.log(`✅ Task ${taskId} status updated successfully`)
      return (result.rowCount ?? 0) > 0
    } catch (error) {
      console.error('❌ Error updating task status in PostgreSQL:', error)
      return false
    }
  }

  /**
   * Get task performance analytics from PostgreSQL
   */
  async getTaskPerformance(): Promise<TaskPerformance[]> {
    try {
      console.log('📊 Fetching task performance analytics from PostgreSQL...')

      const result = await query(`
        SELECT 
          t.assigned_to_employee_id as employee_id,
          e.first_name || ' ' || e.last_name as employee_name,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN t.status = 'overdue' THEN 1 END) as overdue_tasks,
          COALESCE(SUM(t.estimated_value), 0) as revenue_impact
        FROM ai_tasks t
        LEFT JOIN employees e ON t.assigned_to_employee_id = e.id
        WHERE t.assigned_to_employee_id IS NOT NULL
        GROUP BY t.assigned_to_employee_id, e.first_name, e.last_name
        ORDER BY total_tasks DESC
      `)

      const performance = result.rows.map(row => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name || 'Unknown',
        total_tasks: parseInt(row.total_tasks || '0'),
        completed_tasks: parseInt(row.completed_tasks || '0'),
        completion_rate: row.total_tasks > 0 ? row.completed_tasks / row.total_tasks : 0,
        overdue_tasks: parseInt(row.overdue_tasks || '0'),
        revenue_impact: parseFloat(row.revenue_impact || '0'),
        avg_completion_time: 0 // Would need to calculate from actual data
      }))

      console.log(`✅ Generated task performance for ${performance.length} employees`)
      return performance
    } catch (error) {
      console.error('❌ Error fetching task performance from PostgreSQL:', error)
      return []
    }
  }
} 