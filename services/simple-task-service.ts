import { createClient } from '@/lib/supabase'

export interface SimpleTask {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  client_name: string
  quotation_id: number
  estimated_value: number
  due_date: string
  ai_reasoning: string
  assigned_to: string
  business_impact: string
}

export class SimpleTaskService {
  private supabase = createClient()

  /**
   * Generate tasks based on existing quotations
   */
  async generateSimpleTasks(): Promise<{ tasksCreated: number; tasks: SimpleTask[] }> {
    try {
      console.log("🤖 Simple Task Generator: Analyzing existing quotations...")

      // Get all quotations from existing database
      const { data: quotations, error } = await this.supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Database error:", error)
        return { tasksCreated: 0, tasks: [] }
      }

      if (!quotations || quotations.length === 0) {
        console.log("No quotations found")
        return { tasksCreated: 0, tasks: [] }
      }

      // Get employee data for assignments
      const { data: employees } = await this.supabase
        .from('employees')
        .select('id, first_name, last_name, job_title')

      const employeeList = employees || []
      const tasks: SimpleTask[] = []

      // Analyze each quotation and create appropriate tasks
      for (const quotation of quotations) {
        const daysSinceCreated = Math.floor(
          (new Date().getTime() - new Date(quotation.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        // Determine what tasks are needed based on quotation status and age
        if (quotation.status === 'draft' && daysSinceCreated >= 0) {
          tasks.push(this.createApprovalTask(quotation, employeeList))
        }

        if (quotation.status === 'sent' && daysSinceCreated >= 1) {
          tasks.push(this.createFollowUpTask(quotation, employeeList))
        }

        if (quotation.status === 'approved' && daysSinceCreated >= 3) {
          tasks.push(this.createPaymentTask(quotation, employeeList))
        }
      }

      console.log(`🎯 Generated ${tasks.length} intelligent tasks`)

      return {
        tasksCreated: tasks.length,
        tasks: tasks.slice(0, 10) // Limit to 10 tasks for demo
      }
    } catch (error) {
      console.error("❌ Simple Task Generation Error:", error)
      return { tasksCreated: 0, tasks: [] }
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
      due_date: this.calculateDueDate(0), // Due today - immediate action needed
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
      due_date: this.calculateDueDate(1), // Due tomorrow
      ai_reasoning: `Payment pending for ${daysSince} days on approved quotation. Critical for cash flow and client relationship.`,
      assigned_to: assignedEmployee,
      business_impact: `Cash Flow Impact: ₹${value.toLocaleString()} • Payment Collection • Revenue Recognition`
    }
  }

  private findBestEmployee(employees: any[], preferredTitles: string[]): string {
    if (!employees || employees.length === 0) return 'Unassigned'

    // Try to find employee with preferred job title
    for (const title of preferredTitles) {
      const employee = employees.find(emp => 
        emp.job_title?.toUpperCase().includes(title.toUpperCase())
      )
      if (employee) {
        return `${employee.first_name} ${employee.last_name} (${employee.job_title})`
      }
    }

    // Fallback to first employee
    const fallback = employees[0]
    return `${fallback.first_name} ${fallback.last_name} (${fallback.job_title || 'Employee'})`
  }

  private calculatePriority(value: number, daysSince: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (value > 50000 && daysSince > 2) return 'urgent'
    if (value > 50000 || daysSince > 1) return 'high'
    if (value > 30000 || daysSince > 0) return 'medium'
    return 'low'
  }

  private calculateDueDate(daysFromNow: number): string {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysFromNow)
    return dueDate.toISOString()
  }
} 