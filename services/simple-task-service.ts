import { query, transaction } from '@/lib/postgresql-client'

export interface SimpleTask {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  client_name: string
  quotation_id?: number
  lead_id?: number
  estimated_value: number
  due_date: string
  ai_reasoning: string
  assigned_to: string
  business_impact: string
}

/**
 * SALES-FOCUSED AI Task Service - NOW 100% POSTGRESQL
 * ====================================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Transaction safety for critical operations  
 * - Enhanced error handling and logging
 * - Optimized batch operations
 * - All Supabase dependencies eliminated
 * 
 * This service ONLY generates tasks related to sales activities:
 * - Lead follow-ups
 * - Quotation approvals
 * - Payment collections
 * - Client meetings
 * 
 * NO administrative, technical, or training tasks are created here.
 */
export class SimpleTaskService {

  /**
   * Generate SALES-ONLY tasks based on existing quotations and leads via PostgreSQL
   */
  async generateSimpleTasks(): Promise<{ tasksCreated: number; tasks: SimpleTask[] }> {
    try {
      console.log("🎯 SALES-FOCUSED Task Generator: Analyzing quotations and leads via PostgreSQL...")

      const tasks: SimpleTask[] = []

      // 1. Generate quotation-based sales tasks via PostgreSQL
      const quotationTasks = await this.generateQuotationTasks()
      tasks.push(...quotationTasks)

      // 2. Generate lead-based sales tasks via PostgreSQL
      const leadTasks = await this.generateLeadTasks()
      tasks.push(...leadTasks)

      console.log(`🎯 Generated ${tasks.length} SALES-FOCUSED tasks via PostgreSQL`)

      // Save the best tasks to database via PostgreSQL
      const savedTasks = await this.saveTasksToDatabase(tasks.slice(0, 5)) // Limit to 5 best tasks

      return {
        tasksCreated: savedTasks.length,
        tasks: savedTasks
      }
    } catch (error) {
      console.error("❌ Sales Task Generation Error via PostgreSQL:", error)
      return { tasksCreated: 0, tasks: [] }
    }
  }

  /**
   * Generate tasks from quotations (approvals, follow-ups, payments) via PostgreSQL
   */
  private async generateQuotationTasks(): Promise<SimpleTask[]> {
    try {
      console.log('📊 Fetching quotations for task generation via PostgreSQL...')
      
      const quotationsResult = await query(`
        SELECT * FROM quotations 
        ORDER BY created_at DESC 
        LIMIT 20
      `)

      const quotations = quotationsResult.rows

      if (quotations.length === 0) {
        console.log("⚠️ No quotations found for task generation")
        return []
      }

      const employeesResult = await query(`
        SELECT id, first_name, last_name, name, position, job_title, department 
        FROM employees 
        WHERE is_active = true
      `)

      const employeeList = employeesResult.rows
      const tasks: SimpleTask[] = []

      for (const quotation of quotations) {
        const daysSinceCreated = Math.floor(
          (new Date().getTime() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        // Check if task already exists for this quotation via PostgreSQL
        const existingTask = await this.checkExistingQuotationTask(quotation.id)
        if (existingTask) continue

        // Generate appropriate task based on quotation status
        if (quotation.status === 'draft' && daysSinceCreated >= 0) {
          tasks.push(this.createApprovalTask(quotation, employeeList))
        } else if (quotation.status === 'sent' && daysSinceCreated >= 1) {
          tasks.push(this.createFollowUpTask(quotation, employeeList))
        } else if (quotation.status === 'approved' && daysSinceCreated >= 3) {
          tasks.push(this.createPaymentTask(quotation, employeeList))
        }
      }

      console.log(`✅ Generated ${tasks.length} quotation-based tasks via PostgreSQL`)
      return tasks
    } catch (error) {
      console.error('❌ Error generating quotation tasks via PostgreSQL:', error)
      return []
    }
  }

  /**
   * Generate tasks from leads (only sales follow-up activities) via PostgreSQL
   */
  private async generateLeadTasks(): Promise<SimpleTask[]> {
    try {
      console.log('📋 Fetching leads for task generation via PostgreSQL...')
      
      const leadsResult = await query(`
        SELECT * FROM leads 
        WHERE status = 'ASSIGNED' 
          AND assigned_to IS NOT NULL
        ORDER BY created_at DESC 
        LIMIT 10
      `)

      const leads = leadsResult.rows

      if (leads.length === 0) {
        console.log("⚠️ No assigned leads found for task generation")
        return []
      }

      const employeesResult = await query(`
        SELECT id, first_name, last_name, name, position, job_title, department 
        FROM employees 
        WHERE is_active = true
      `)

      const employeeList = employeesResult.rows
      const tasks: SimpleTask[] = []

      for (const lead of leads) {
        // Check if task already exists for this lead via PostgreSQL
        const existingTask = await this.checkExistingLeadTask(lead.id)
        if (existingTask) continue

        const daysSinceAssigned = Math.floor(
          (new Date().getTime() - new Date(lead.updated_at || lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        // Only create initial contact task if lead was recently assigned
        if (daysSinceAssigned <= 7) {
          tasks.push(this.createLeadContactTask(lead, employeeList))
        }
      }

      console.log(`✅ Generated ${tasks.length} lead-based tasks via PostgreSQL`)
      return tasks
    } catch (error) {
      console.error('❌ Error generating lead tasks via PostgreSQL:', error)
      return []
    }
  }

  private createApprovalTask(quotation: any, employees: any[]): SimpleTask {
    const assignedEmployee = this.findBestEmployee(employees, ['CTO', 'MANAGER'])
    const value = quotation.total_amount || 0
    
    return {
      id: `approval-${quotation.id}-${Date.now()}`,
      title: `Review and approve quotation for ${quotation.client_name}`,
      description: `Review the ₹${value.toLocaleString()} quotation for ${quotation.client_name} and approve for sending. Verify pricing, terms, and deliverables.`,
      priority: 'medium',
      client_name: quotation.client_name || 'Unknown Client',
      quotation_id: quotation.id,
      estimated_value: value,
      due_date: this.calculateDueDate(1), // Due tomorrow
      ai_reasoning: `Draft quotation pending approval. Quick approval needed to maintain sales momentum.`,
      assigned_to: assignedEmployee,
      business_impact: `Revenue Protection: ₹${value.toLocaleString()} • Sales Pipeline Acceleration • Client Satisfaction`
    }
  }

  private createFollowUpTask(quotation: any, employees: any[]): SimpleTask {
    const assignedEmployee = this.findBestEmployee(employees, ['SEO', 'SALES'])
    const daysSince = Math.floor((new Date().getTime() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const value = quotation.total_amount || 0
    
    return {
      id: `followup-${quotation.id}-${Date.now()}`,
      title: `Follow up with ${quotation.client_name} about quotation`,
      description: `Contact ${quotation.client_name} regarding the ₹${value.toLocaleString()} quotation sent ${daysSince} days ago. Check their interest and address any concerns.`,
      priority: this.calculatePriority(value, daysSince),
      client_name: quotation.client_name || 'Unknown Client',
      quotation_id: quotation.id,
      estimated_value: value,
      due_date: this.calculateDueDate(2), // Due in 2 days
      ai_reasoning: `Quotation sent ${daysSince} days ago without response. High-value client (₹${value.toLocaleString()}) requires immediate attention.`,
      assigned_to: assignedEmployee,
      business_impact: `Revenue Recovery: ₹${value.toLocaleString()} • Deal Closure Risk: High • Client Relationship Maintenance`
    }
  }

  private createPaymentTask(quotation: any, employees: any[]): SimpleTask {
    const assignedEmployee = this.findBestEmployee(employees, ['SEO', 'SALES'])
    const daysSince = Math.floor((new Date().getTime() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const value = quotation.total_amount || 0
    
    return {
      id: `payment-${quotation.id}-${Date.now()}`,
      title: `Follow up on payment from ${quotation.client_name}`,
      description: `Contact ${quotation.client_name} regarding payment for the approved ₹${value.toLocaleString()} quotation. Send invoice if needed and confirm payment timeline.`,
      priority: 'high',
      client_name: quotation.client_name || 'Unknown Client',
      quotation_id: quotation.id,
      estimated_value: value,
      due_date: this.calculateDueDate(1), // Due tomorrow for payments
      ai_reasoning: `Payment pending for approved quotation. Critical for cash flow management.`,
      assigned_to: assignedEmployee,
      business_impact: `Cash Flow: ₹${value.toLocaleString()} • Revenue Realization • Client Account Management`
    }
  }

  private createLeadContactTask(lead: any, employees: any[]): SimpleTask {
    const assignedEmployee = this.findBestEmployee(employees, ['SEO', 'SALES'])
    const estimatedValue = lead.estimated_value || 25000 // Default estimated value
    
    return {
      id: `lead-contact-${lead.id}-${Date.now()}`,
      title: `Initial contact with lead: ${lead.client_name || lead.contact_name}`,
      description: `Make initial contact with ${lead.client_name || lead.contact_name} to qualify requirements and schedule meeting. Lead source: ${lead.lead_source || 'Unknown'}.`,
      priority: 'medium',
      client_name: lead.client_name || lead.contact_name || 'Unknown Lead',
      lead_id: lead.id,
      estimated_value: estimatedValue,
      due_date: this.calculateDueDate(2), // Due in 2 days
      ai_reasoning: `New assigned lead requires initial contact to begin qualification process.`,
      assigned_to: assignedEmployee,
      business_impact: `Pipeline Development • Lead Qualification • Revenue Opportunity: ₹${estimatedValue.toLocaleString()}`
    }
  }

  private async checkExistingQuotationTask(quotationId: number): Promise<boolean> {
    try {
      const result = await query(`
        SELECT id FROM ai_tasks 
        WHERE quotation_id = $1 
          AND status IN ('pending', 'in_progress')
        LIMIT 1
      `, [quotationId])
      
      return result.rows.length > 0
    } catch (error) {
      console.error('❌ Error checking existing quotation task:', error)
      return false
    }
  }

  private async checkExistingLeadTask(leadId: number): Promise<boolean> {
    try {
      const result = await query(`
        SELECT id FROM ai_tasks 
        WHERE lead_id = $1 
          AND status IN ('pending', 'in_progress')
        LIMIT 1
      `, [leadId])
      
      return result.rows.length > 0
    } catch (error) {
      console.error('❌ Error checking existing lead task:', error)
      return false
    }
  }

  private async saveTasksToDatabase(tasks: SimpleTask[]): Promise<SimpleTask[]> {
    try {
      console.log(`💾 Saving ${tasks.length} tasks to PostgreSQL...`)
      
      const savedTasks: SimpleTask[] = []

      // Use transaction for data consistency
      await transaction(async (client) => {
        for (const task of tasks) {
          const result = await client.query(`
            INSERT INTO ai_tasks (
              title, description, task_type, priority, status, 
              quotation_id, lead_id, client_name, due_date, 
              estimated_duration_minutes, business_impact, estimated_value,
              ai_reasoning, ai_confidence_score, assigned_to_employee_name,
              created_at, updated_at
            ) VALUES (
              $1, $2, 'sales_follow_up', $3, 'pending',
              $4, $5, $6, $7, 30, 'medium', $8,
              $9, 0.8, $10, NOW(), NOW()
            ) RETURNING *
          `, [
            task.title,
            task.description,
            task.priority,
            task.quotation_id || null,
            task.lead_id || null,
            task.client_name,
            task.due_date,
            task.estimated_value,
            task.ai_reasoning,
            task.assigned_to
          ])

          const savedTask = result.rows[0]
          savedTasks.push({
            ...task,
            id: savedTask.id
          })
        }
      })

      console.log(`✅ Successfully saved ${savedTasks.length} tasks to PostgreSQL`)
      return savedTasks
    } catch (error) {
      console.error('❌ Error saving tasks to PostgreSQL:', error)
      return []
    }
  }

  private findBestEmployee(employees: any[], preferredTitles: string[]): string {
    // Try to find employee with preferred titles
    for (const title of preferredTitles) {
      const employee = employees.find(emp => 
        (emp.job_title && emp.job_title.toUpperCase().includes(title)) ||
        (emp.position && emp.position.toUpperCase().includes(title)) ||
        (emp.department && emp.department.toUpperCase().includes(title))
      )
      
      if (employee) {
        const firstName = employee.first_name || employee.name || 'Unknown'
        const lastName = employee.last_name || ''
        return `${firstName} ${lastName}`.trim()
      }
    }
    
    // Fallback to first available employee
    if (employees.length > 0) {
      const employee = employees[0]
      const firstName = employee.first_name || employee.name || 'Unknown'
      const lastName = employee.last_name || ''
      return `${firstName} ${lastName}`.trim()
    }
    
    return 'Unassigned'
  }

  private calculatePriority(value: number, daysSince: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (value >= 100000 && daysSince >= 3) return 'urgent'
    if (value >= 50000 && daysSince >= 2) return 'high'
    if (daysSince >= 5) return 'high'
    return 'medium'
  }

  private calculateDueDate(daysFromNow: number): string {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString()
  }
} 