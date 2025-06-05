import { createClient } from '@/lib/supabase'
import { AIBusinessIntelligenceService, ComprehensiveBusinessData } from './ai-business-intelligence-service'

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
  private supabase = createClient()
  private biService = new AIBusinessIntelligenceService()

  /**
   * Main AI Task Generation Engine
   * Analyzes business data and automatically creates tasks
   */
  async generateAITasks(): Promise<{ tasksCreated: number; tasks: AITask[] }> {
    try {
      console.log("🤖 AI Task Generator: Starting intelligent task analysis...")

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
      // Get employees with their current workload
      const { data: employees, error } = await this.supabase
        .from('employees')
        .select(`
          id, 
          first_name, 
          last_name, 
          job_title,
          departments:department_id (name)
        `)

      if (error) throw error

      // Assignment logic based on task type
      switch (taskType) {
        case 'quotation_follow_up':
        case 'payment_follow_up':
          // Prefer Sales Head, fallback to any sales member
          return this.findBestEmployee(employees, ['SALES HEAD', 'SEO'], 'SALES')
        
        case 'quotation_approval':
          // Prefer Sales Manager or CTO
          return this.findBestEmployee(employees, ['CTO', 'SALES MANAGER'], 'SALES')
        
        default:
          return employees && employees.length > 0 ? {
            id: employees[0].id,
            name: `${employees[0].first_name} ${employees[0].last_name}`
          } : null
      }
    } catch (error) {
      console.error('Error in smart assignment:', error)
      return null
    }
  }

  /**
   * Find best employee based on job title and department
   */
  private findBestEmployee(employees: any[], preferredTitles: string[], fallbackDepartment: string): { id: number; name: string } | null {
    if (!employees || employees.length === 0) return null

    // First try preferred job titles
    for (const title of preferredTitles) {
      const employee = employees.find(emp => 
        emp.job_title?.toUpperCase().includes(title.toUpperCase())
      )
      if (employee) {
        return {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`
        }
      }
    }

    // Fallback to department
    const employee = employees.find(emp => 
      emp.departments?.name === fallbackDepartment
    )
    
    if (employee) {
      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`
      }
    }

    // Final fallback to first employee
    return {
      id: employees[0].id,
      name: `${employees[0].first_name} ${employees[0].last_name}`
    }
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
   * Check if task already exists
   */
  private async checkExistingTask(taskType: string, quotationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('ai_tasks')
        .select('id')
        .eq('task_type', taskType)
        .eq('quotation_id', quotationId)
        .eq('status', 'pending')
        .single()

      return !!data && !error
    } catch {
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
   * Save tasks to database
   */
  private async saveTasks(tasks: AITask[]): Promise<AITask[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_tasks')
        .insert(tasks.map(task => ({
          ...task,
          id: undefined // Let database generate ID
        })))
        .select()

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error saving tasks:', error)
      return []
    }
  }

  /**
   * Generate reminders for tasks
   */
  private async generateReminders(tasks: AITask[]): Promise<void> {
    try {
      const reminders = []

      for (const task of tasks) {
        // Create reminder 1 day before due date
        const reminderDate = new Date(task.due_date)
        reminderDate.setDate(reminderDate.getDate() - 1)

        reminders.push({
          task_id: task.id,
          reminder_type: 'due_soon',
          scheduled_at: reminderDate.toISOString(),
          notification_channel: 'in_app',
          recipient_employee_id: task.assigned_to_employee_id,
          message_template: `Reminder: Task "${task.title}" is due tomorrow`
        })

        // Create overdue reminder for due date
        reminders.push({
          task_id: task.id,
          reminder_type: 'overdue',
          scheduled_at: task.due_date,
          notification_channel: 'in_app',
          recipient_employee_id: task.assigned_to_employee_id,
          message_template: `OVERDUE: Task "${task.title}" is now overdue`
        })
      }

      const { error } = await this.supabase
        .from('task_reminders')
        .insert(reminders)

      if (error) throw error
    } catch (error) {
      console.error('Error creating reminders:', error)
    }
  }

  /**
   * Get active task rules
   */
  private async getActiveTaskRules(): Promise<TaskRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_task_rules')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching task rules:', error)
      return []
    }
  }

  /**
   * Get tasks for a specific employee
   */
  async getEmployeeTasks(employeeId: number): Promise<AITask[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_tasks')
        .select('*')
        .eq('assigned_to_employee_id', employeeId)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching employee tasks:', error)
      return []
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string, completionNotes?: string): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.completion_notes = completionNotes
      }

      const { error } = await this.supabase
        .from('ai_tasks')
        .update(updateData)
        .eq('id', taskId)

      return !error
    } catch (error) {
      console.error('Error updating task status:', error)
      return false
    }
  }

  /**
   * Get task performance analytics
   */
  async getTaskPerformance(): Promise<TaskPerformance[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_tasks')
        .select(`
          assigned_to_employee_id,
          status,
          estimated_value,
          employees:assigned_to_employee_id (first_name, last_name)
        `)

      if (error) throw error

      // Process and group by employee
      const performanceMap = new Map<number, any>()

      data?.forEach(task => {
        const empId = task.assigned_to_employee_id
        if (!empId) return

        if (!performanceMap.has(empId)) {
          const employeeData = task.employees as any
          performanceMap.set(empId, {
            employee_id: empId,
            employee_name: employeeData ? `${employeeData.first_name} ${employeeData.last_name}` : 'Unknown',
            total_tasks: 0,
            completed_tasks: 0,
            overdue_tasks: 0,
            revenue_impact: 0
          })
        }

        const perf = performanceMap.get(empId)
        perf.total_tasks++
        
        if (task.status === 'completed') {
          perf.completed_tasks++
          perf.revenue_impact += task.estimated_value || 0
        } else if (task.status === 'overdue') {
          perf.overdue_tasks++
        }
      })

      return Array.from(performanceMap.values()).map(perf => ({
        ...perf,
        completion_rate: perf.total_tasks > 0 ? perf.completed_tasks / perf.total_tasks : 0,
        avg_completion_time: 0 // Would need to calculate from actual data
      }))
    } catch (error) {
      console.error('Error fetching task performance:', error)
      return []
    }
  }
} 