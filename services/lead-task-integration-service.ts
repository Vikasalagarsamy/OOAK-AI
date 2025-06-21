import { query, transaction } from '@/lib/postgresql-client'
import { getUserIdForDatabase } from '@/lib/uuid-helpers'
import type { LeadStatus } from '@/types/follow-up'
import { v4 as uuidv4 } from 'uuid'

// Singleton instance
let instance: LeadTaskIntegrationService | null = null

export interface LeadTaskTriggerEvent {
  eventType: 'lead_assigned' | 'lead_status_changed' | 'quotation_created' | 'quotation_sent' | 'quotation_approved'
  leadId: number
  leadData: {
    id: number
    lead_number: string
    client_name: string
    status: LeadStatus
    estimated_value?: number
    assigned_to?: number
    company_id: number
    branch_id?: number
    created_at: string
    updated_at?: string
  }
  quotationData?: {
    id: number
    quotation_number: string
    total_amount: number
    status: string
    created_at: string
  }
  previousStatus?: LeadStatus
  triggeredBy?: string
}

export interface AITaskGenerationResult {
  success: boolean
  tasksGenerated: number
  tasks: GeneratedTask[]
  businessInsights: string[]
  error?: string
}

export interface GeneratedTask {
  id: string
  title: string
  description: string
  task_type: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to_employee_id?: number
  assigned_to_name?: string
  lead_id: number
  quotation_id?: number
  client_name: string
  due_date: string
  estimated_value: number
  sla_hours: number
  ai_reasoning: string
  business_impact: string
  department_assigned?: string
  designation_assigned?: string
}

export interface BusinessRule {
  id: string
  name: string
  description: string
  triggerCondition: (event: LeadTaskTriggerEvent) => boolean
  taskGenerator: (event: LeadTaskTriggerEvent, employees: any[]) => Promise<GeneratedTask | null>
  priority: 'low' | 'medium' | 'high' | 'urgent'
  slaHours: number
  enabled: boolean
  departmentPreferences: string[]
  designationPreferences: string[]
  autoAssignRules?: {
    highValue?: boolean
    experienceLevel?: 'junior' | 'senior' | 'expert'
    workloadBalancing?: boolean
    specificAssignee?: string
  }
}

export class LeadTaskIntegrationService {
  private static instance: LeadTaskIntegrationService | null = null

  constructor() {
    if (LeadTaskIntegrationService.instance) {
      console.log('🔄 Returning existing LeadTaskIntegrationService instance')
      return LeadTaskIntegrationService.instance
    }
    console.log('✨ Creating new PostgreSQL-powered LeadTaskIntegrationService instance')
    LeadTaskIntegrationService.instance = this
  }

  public static getInstance(): LeadTaskIntegrationService {
    if (!LeadTaskIntegrationService.instance) {
      LeadTaskIntegrationService.instance = new LeadTaskIntegrationService()
    }
    return LeadTaskIntegrationService.instance
  }

  // 🎯 Enhanced Business Rules for Lead-Task Integration
  private businessRules: BusinessRule[] = [
    {
      id: 'lead_assignment_initial_contact',
      name: 'Initial Contact Task on Lead Assignment',
      description: 'Create immediate contact task when lead is assigned to team member',
      triggerCondition: (event) => 
        event.eventType === 'lead_assigned' || 
        (event.eventType === 'lead_status_changed' && 
         event.previousStatus === 'UNASSIGNED' && 
         event.leadData.status === 'ASSIGNED'),
      taskGenerator: this.generateInitialContactTask.bind(this),
      priority: 'medium',
      slaHours: 24, // Must contact within 24 hours
      enabled: true,
      departmentPreferences: ['SALES', 'SEO'],
      designationPreferences: ['Sales Head', 'Sales Resource', 'SEO'],
      autoAssignRules: {
        workloadBalancing: true,
        experienceLevel: 'senior'
      }
    },
    
    {
      id: 'lead_qualification_task',
      name: 'Lead Qualification Task',
      description: 'Create qualification task when lead is contacted',
      triggerCondition: (event) => 
        event.eventType === 'lead_status_changed' && 
        event.leadData.status === 'CONTACTED',
      taskGenerator: this.generateQualificationTask.bind(this),
      priority: 'medium',
      slaHours: 48, // Must qualify within 48 hours
      enabled: true,
      departmentPreferences: ['SALES'],
      designationPreferences: ['Sales Head', 'Senior Sales'],
      autoAssignRules: {
        workloadBalancing: false,
        experienceLevel: 'senior'
      }
    },
    
    {
      id: 'quotation_preparation_task',
      name: 'Quotation Preparation Task',
      description: 'Create quotation preparation task for qualified leads',
      triggerCondition: (event) => 
        event.eventType === 'lead_status_changed' && 
        event.leadData.status === 'QUALIFIED',
      taskGenerator: this.generateQuotationPreparationTask.bind(this),
      priority: 'high',
      slaHours: 48, // Must prepare quotation within 48 hours
      enabled: true,
      departmentPreferences: ['SALES'],
      designationPreferences: ['Sales Head'],
      autoAssignRules: {
        workloadBalancing: false,
        experienceLevel: 'expert'
      }
    },
    
    {
      id: 'high_value_lead_escalation',
      name: 'High-Value Lead Escalation',
      description: 'Escalate high-value leads (>₹1L) to management immediately',
      triggerCondition: (event) => 
        (event.leadData.estimated_value || 0) >= 100000 && 
        ['lead_assigned', 'lead_status_changed'].includes(event.eventType) &&
        event.leadData.status === 'ASSIGNED',
      taskGenerator: this.generateHighValueEscalationTask.bind(this),
      priority: 'urgent',
      slaHours: 12, // Must contact within 12 hours for high-value
      enabled: true,
      departmentPreferences: ['SALES'],
      designationPreferences: ['Manager', 'Sales Head'],
      autoAssignRules: {
        highValue: true,
        specificAssignee: 'Vikas Alagarsamy (SEO)', // Always assign high-value to manager
        experienceLevel: 'expert'
      }
    },
    
    {
      id: 'quotation_followup_task',
      name: 'Quotation Follow-up Task',
      description: 'Create follow-up task when quotation is sent',
      triggerCondition: (event) => 
        event.eventType === 'quotation_sent',
      taskGenerator: this.generateQuotationFollowupTask.bind(this),
      priority: 'high',
      slaHours: 24, // Follow up within 24 hours of sending
      enabled: true,
      departmentPreferences: ['SALES'],
      designationPreferences: ['Sales Resource', 'Sales Head'],
      autoAssignRules: {
        workloadBalancing: true,
        experienceLevel: 'senior'
      }
    },
    
    {
      id: 'payment_followup_task',
      name: 'Payment Follow-up Task',
      description: 'Create payment follow-up task for approved quotations',
      triggerCondition: (event) => 
        event.eventType === 'quotation_approved',
      taskGenerator: this.generatePaymentFollowupTask.bind(this),
      priority: 'high',
      slaHours: 72, // Follow up on payment within 3 days
      enabled: true,
      departmentPreferences: ['SALES', 'ACCOUNTS'],
      designationPreferences: ['Sales Head', 'Accounts Manager'],
      autoAssignRules: {
        workloadBalancing: true,
        experienceLevel: 'senior'
      }
    }
  ]

  /**
   * Main entry point - process lead event and generate appropriate tasks
   */
  async processLeadEvent(event: LeadTaskTriggerEvent): Promise<AITaskGenerationResult> {
    try {
      console.log(`🎯 Processing lead event with PostgreSQL: ${event.eventType} for lead ${event.leadId}`)
      console.log(`📋 Lead data:`, event.leadData)
      console.log(`📋 Previous status:`, event.previousStatus)
      
      const result: AITaskGenerationResult = {
        success: true,
        tasksGenerated: 0,
        tasks: [],
        businessInsights: []
      }

      // Get employees for assignment using PostgreSQL
      const employees = await this.getAllEmployees()
      console.log(`👥 Found ${employees.length} employees for task assignment`)
      
      // Process each applicable business rule
      for (const rule of this.businessRules.filter(r => r.enabled)) {
        console.log(`🔍 Checking rule: ${rule.name}`)
        console.log(`📋 Rule details:`, {
          id: rule.id,
          name: rule.name,
          enabled: rule.enabled,
          priority: rule.priority,
          slaHours: rule.slaHours,
          departmentPreferences: rule.departmentPreferences,
          designationPreferences: rule.designationPreferences
        })
        
        if (rule.triggerCondition(event)) {
          console.log(`✅ Rule triggered: ${rule.name}`)
          
          // Check if task already exists for this rule + lead combination
          const existingTask = await this.checkExistingTask(rule.id, event.leadId, event.quotationData?.id)
          console.log(`📋 Existing task check: ${existingTask ? 'Found existing task' : 'No existing task'}`)
          
          if (!existingTask) {
            try {
              console.log(`🎯 Generating task using rule: ${rule.name}`)
              const task = await rule.taskGenerator(event, employees)
              
              if (task) {
                console.log(`✨ Task generated:`, {
                  title: task.title,
                  assigned_to: task.assigned_to_name,
                  employee_id: task.assigned_to_employee_id,
                  task_type: task.task_type,
                  priority: task.priority,
                  due_date: task.due_date
                })
                
                // Save task to PostgreSQL database
                const savedTask = await this.saveTaskToDatabase(task, rule, event)
                
                if (savedTask) {
                  result.tasks.push(task)
                  result.tasksGenerated++
                  
                  console.log(`✅ Task saved successfully in PostgreSQL: ${task.title}`)
                  
                  // Log the generation event
                  await this.logTaskGeneration(task, rule, event, true)
                } else {
                  console.error(`❌ Failed to save task: ${task.title}`)
                  await this.logTaskGeneration(task, rule, event, false, 'Database save failed')
                }
              } else {
                console.log(`⚠️ No task generated by rule: ${rule.name}`)
              }
            } catch (error: any) {
              console.error(`❌ Failed to generate task for rule ${rule.id}:`, error)
              await this.logTaskGeneration(null, rule, event, false, error?.message || 'Unknown error')
            }
          } else {
            console.log(`⏭️ Task already exists for rule ${rule.id} and lead ${event.leadId}`)
          }
        } else {
          console.log(`⏭️ Rule not triggered: ${rule.name}`)
        }
      }

      // Generate business insights
      result.businessInsights = this.generateBusinessInsights(result, event)

      console.log(`🎯 Lead event processing complete: ${result.tasksGenerated} tasks generated`)
      return result

    } catch (error: any) {
      console.error('❌ Lead event processing failed:', error)
      return {
        success: false,
        tasksGenerated: 0,
        tasks: [],
        businessInsights: [],
        error: error?.message || 'Unknown error'
      }
    }
  }

  /**
   * Generate initial contact task for assigned leads
   */
  private async generateInitialContactTask(
    event: LeadTaskTriggerEvent, 
    employees: any[]
  ): Promise<GeneratedTask | null> {
    const lead = event.leadData
    
    // Find the employee that the lead is assigned to
    let assignedEmployee = null
    if (lead.assigned_to) {
      assignedEmployee = employees.find(emp => emp.id === lead.assigned_to)
      console.log(`🎯 Found assigned employee for lead ${lead.id}:`, {
        lead_assigned_to: lead.assigned_to,
        employee_found: !!assignedEmployee,
        employee_details: assignedEmployee ? {
          id: assignedEmployee.id,
          name: assignedEmployee.name || assignedEmployee.full_name,
          first_name: assignedEmployee.first_name,
          last_name: assignedEmployee.last_name,
          department: assignedEmployee.department,
          job_title: assignedEmployee.job_title
        } : null
      })
    }
    
    // If no specific assignment or employee not found, use best available
    if (!assignedEmployee) {
      console.log(`⚠️ No assigned employee found for lead ${lead.id}, using best available`)
      assignedEmployee = await this.findBestEmployee(
        employees, 
        ['SALES', 'SEO'], 
        ['Sales Head', 'Sales Resource', 'SEO'],
        { workloadBalancing: true }
      )
    }

    // Build employee name from available fields
    const employeeName = assignedEmployee?.name || 
                         (assignedEmployee?.first_name && assignedEmployee?.last_name 
                           ? `${assignedEmployee.first_name} ${assignedEmployee.last_name}` 
                           : assignedEmployee?.first_name || assignedEmployee?.last_name || 'Sales Team')

    console.log(`📋 Generating task with employee:`, {
      id: assignedEmployee?.id,
      name: employeeName,
      department: assignedEmployee?.department,
      job_title: assignedEmployee?.job_title
    })

    const task = {
      id: `initial-contact-${lead.id}-${Date.now()}`,
      title: `Initial contact with ${lead.client_name}`,
      description: `Make initial contact with ${lead.client_name} (Lead #${lead.lead_number || `L${lead.id}`}). Introduce yourself, understand their requirements, and schedule a detailed discussion. This is a fresh lead that needs immediate attention.`,
      task_type: 'lead_follow_up',
      priority: 'medium' as const,
      assigned_to_employee_id: assignedEmployee?.id,
      assigned_to_name: employeeName,
      lead_id: lead.id,
      client_name: lead.client_name,
      due_date: this.calculateDueDate(24), // 24 hours
      estimated_value: lead.estimated_value || 30000,
      sla_hours: 24,
      ai_reasoning: `New lead assigned and requires immediate initial contact within 24 hours. Client: ${lead.client_name}. Estimated value: ₹${(lead.estimated_value || 30000).toLocaleString()}. Critical for first impression and relationship building. Assigned to lead owner: ${employeeName}.`,
      business_impact: `First Impression • Relationship Building • Pipeline Entry • Revenue Opportunity: ₹${(lead.estimated_value || 30000).toLocaleString()}`,
      department_assigned: assignedEmployee?.department,
      designation_assigned: assignedEmployee?.designation || assignedEmployee?.job_title
    }

    console.log(`✅ Generated task for lead ${lead.id}:`, {
      task_title: task.title,
      assigned_to_employee_id: task.assigned_to_employee_id,
      assigned_to_name: task.assigned_to_name,
      employee_name: employeeName,
      task_type: task.task_type,
      priority: task.priority,
      due_date: task.due_date
    })

    return task
  }

  /**
   * Generate qualification task for contacted leads
   */
  private async generateQualificationTask(
    event: LeadTaskTriggerEvent, 
    employees: any[]
  ): Promise<GeneratedTask | null> {
    const lead = event.leadData
    const assignedEmployee = await this.findBestEmployee(
      employees, 
      ['SALES'], 
      ['Sales Head', 'Senior Sales'],
      { workloadBalancing: false, experienceLevel: 'senior' }
    )

    return {
      id: `qualification-${lead.id}-${Date.now()}`,
      title: `Qualify lead requirements - ${lead.client_name}`,
      description: `Conduct detailed qualification of ${lead.client_name}. Understand their specific needs, budget, timeline, and decision-making process. Assess fit for our services and determine next steps for quotation preparation.`,
      task_type: 'lead_follow_up',
      priority: 'medium',
      assigned_to_employee_id: assignedEmployee?.id,
      assigned_to_name: assignedEmployee?.name,
      lead_id: lead.id,
      client_name: lead.client_name,
      due_date: this.calculateDueDate(48), // 48 hours
      estimated_value: lead.estimated_value || 30000,
      sla_hours: 48,
      ai_reasoning: `Lead has been contacted and is ready for qualification. Need to assess requirements, budget (estimated ₹${(lead.estimated_value || 30000).toLocaleString()}), and timeline to progress to quotation stage.`,
      business_impact: `Lead Qualification • Requirements Gathering • Pipeline Progression • Conversion Opportunity`,
      department_assigned: assignedEmployee?.department,
      designation_assigned: assignedEmployee?.designation
    }
  }

  /**
   * Generate quotation preparation task for qualified leads
   */
  private async generateQuotationPreparationTask(
    event: LeadTaskTriggerEvent, 
    employees: any[]
  ): Promise<GeneratedTask | null> {
    const lead = event.leadData
    const assignedEmployee = await this.findBestEmployee(
      employees, 
      ['SALES'], 
      ['Sales Head'],
      { workloadBalancing: false, experienceLevel: 'expert' }
    )

    return {
      id: `quotation-prep-${lead.id}-${Date.now()}`,
      title: `Prepare quotation for ${lead.client_name}`,
      description: `Prepare comprehensive quotation for ${lead.client_name} based on qualified requirements. Include all services, pricing, terms, and deliverables. Ensure quotation is accurate and compelling for client approval.`,
      task_type: 'quotation_approval',
      priority: 'high',
      assigned_to_employee_id: assignedEmployee?.id,
      assigned_to_name: assignedEmployee?.name,
      lead_id: lead.id,
      client_name: lead.client_name,
      due_date: this.calculateDueDate(48), // 48 hours
      estimated_value: lead.estimated_value || 30000,
      sla_hours: 48,
      ai_reasoning: `Lead is qualified and ready for quotation. High priority task to prepare accurate quotation within 48 hours to maintain sales momentum. Estimated value: ₹${(lead.estimated_value || 30000).toLocaleString()}.`,
      business_impact: `Revenue Generation • Deal Closure • Client Conversion • Value: ₹${(lead.estimated_value || 30000).toLocaleString()}`,
      department_assigned: assignedEmployee?.department,
      designation_assigned: assignedEmployee?.designation
    }
  }

  /**
   * Generate high-value lead escalation task
   */
  private async generateHighValueEscalationTask(
    event: LeadTaskTriggerEvent, 
    employees: any[]
  ): Promise<GeneratedTask | null> {
    const lead = event.leadData
    const managerEmployee = employees.find(emp => 
      emp.name === 'Vikas Alagarsamy (SEO)' || 
      emp.designation?.includes('Manager') ||
      emp.designation?.includes('Sales Head')
    ) || employees[0]

    return {
      id: `high-value-${lead.id}-${Date.now()}`,
      title: `🚨 HIGH VALUE: Manage lead ${lead.client_name} (₹${(lead.estimated_value || 0).toLocaleString()})`,
      description: `URGENT: High-value lead (₹${(lead.estimated_value || 0).toLocaleString()}) requires immediate management attention. Client: ${lead.client_name}. This lead has significant revenue potential and needs expert handling to ensure conversion.`,
      task_type: 'lead_follow_up',
      priority: 'urgent',
      assigned_to_employee_id: managerEmployee?.id,
      assigned_to_name: managerEmployee?.name,
      lead_id: lead.id,
      client_name: lead.client_name,
      due_date: this.calculateDueDate(12), // 12 hours
      estimated_value: lead.estimated_value || 100000,
      sla_hours: 12,
      ai_reasoning: `HIGH VALUE ALERT: Lead worth ₹${(lead.estimated_value || 0).toLocaleString()} requires immediate management intervention. Risk of losing major client if not handled expertly within 12 hours.`,
      business_impact: `🎯 CRITICAL REVENUE: ₹${(lead.estimated_value || 0).toLocaleString()} • Executive Attention Required • Major Client Acquisition`,
      department_assigned: managerEmployee?.department,
      designation_assigned: managerEmployee?.designation
    }
  }

  /**
   * Generate quotation follow-up task
   */
  private async generateQuotationFollowupTask(
    event: LeadTaskTriggerEvent, 
    employees: any[]
  ): Promise<GeneratedTask | null> {
    const lead = event.leadData
    const quotation = event.quotationData
    if (!quotation) return null

    const assignedEmployee = await this.findBestEmployee(
      employees, 
      ['SALES'], 
      ['Sales Resource', 'Sales Head'],
      { workloadBalancing: true }
    )

    return {
      id: `quotation-followup-${lead.id}-${quotation.id}-${Date.now()}`,
      title: `Follow up with ${lead.client_name} about quotation`,
      description: `Follow up with ${lead.client_name} regarding quotation ${quotation.quotation_number} (₹${quotation.total_amount.toLocaleString()}). Check if they have any questions, address concerns, and request feedback on the proposal.`,
      task_type: 'quotation_follow_up',
      priority: 'high',
      assigned_to_employee_id: assignedEmployee?.id,
      assigned_to_name: assignedEmployee?.name,
      lead_id: lead.id,
      quotation_id: quotation.id,
      client_name: lead.client_name,
      due_date: this.calculateDueDate(24), // 24 hours
      estimated_value: quotation.total_amount,
      sla_hours: 24,
      ai_reasoning: `Quotation sent to client and needs follow-up within 24 hours to maintain engagement. Value: ₹${quotation.total_amount.toLocaleString()}. Critical for conversion and deal closure.`,
      business_impact: `Revenue Recovery: ₹${quotation.total_amount.toLocaleString()} • Deal Closure • Client Engagement`,
      department_assigned: assignedEmployee?.department,
      designation_assigned: assignedEmployee?.designation
    }
  }

  /**
   * Generate payment follow-up task
   */
  private async generatePaymentFollowupTask(
    event: LeadTaskTriggerEvent, 
    employees: any[]
  ): Promise<GeneratedTask | null> {
    const lead = event.leadData
    const quotation = event.quotationData
    if (!quotation) return null

    const assignedEmployee = await this.findBestEmployee(
      employees, 
      ['SALES', 'ACCOUNTS'], 
      ['Sales Head', 'Accounts Manager'],
      { workloadBalancing: true }
    )

    return {
      id: `payment-followup-${lead.id}-${quotation.id}-${Date.now()}`,
      title: `Payment follow-up for ${lead.client_name}`,
      description: `Follow up on payment for approved quotation ${quotation.quotation_number} from ${lead.client_name} (₹${quotation.total_amount.toLocaleString()}). Send payment reminder, confirm timeline, and assist with payment process.`,
      task_type: 'payment_follow_up',
      priority: 'high',
      assigned_to_employee_id: assignedEmployee?.id,
      assigned_to_name: assignedEmployee?.name,
      lead_id: lead.id,
      quotation_id: quotation.id,
      client_name: lead.client_name,
      due_date: this.calculateDueDate(72), // 72 hours
      estimated_value: quotation.total_amount,
      sla_hours: 72,
      ai_reasoning: `Quotation approved and payment follow-up required within 3 days. Value: ₹${quotation.total_amount.toLocaleString()}. Critical for cash flow and deal completion.`,
      business_impact: `Cash Flow: ₹${quotation.total_amount.toLocaleString()} • Deal Completion • Revenue Realization`,
      department_assigned: assignedEmployee?.department,
      designation_assigned: assignedEmployee?.designation
    }
  }

  /**
   * Find best employee for task assignment
   */
  private async findBestEmployee(
    employees: any[],
    departmentPreferences: string[],
    designationPreferences: string[],
    autoAssignRules?: {
      highValue?: boolean
      experienceLevel?: 'junior' | 'senior' | 'expert'
      workloadBalancing?: boolean
      specificAssignee?: string
    }
  ): Promise<any> {
    try {
      console.log(`🔍 Finding best employee with preferences:`, {
        departments: departmentPreferences,
        designations: designationPreferences,
        rules: autoAssignRules
      })

      // Log all employees being considered
      console.log(`👥 Considering ${employees.length} employees:`)
      employees.forEach(emp => {
        console.log(`👤 Employee:`, {
          id: emp.id,
          name: emp.name || `${emp.first_name} ${emp.last_name}`,
          department: emp.departments?.name,
          job_title: emp.job_title
        })
      })

      // First try specific assignee if specified
      if (autoAssignRules?.specificAssignee) {
        const specificEmployee = employees.find(emp => 
          emp.name === autoAssignRules.specificAssignee ||
          `${emp.first_name} ${emp.last_name}` === autoAssignRules.specificAssignee
        )
        
        if (specificEmployee) {
          console.log(`✅ Found specific assignee:`, {
            id: specificEmployee.id,
            name: specificEmployee.name || `${specificEmployee.first_name} ${specificEmployee.last_name}`,
            department: specificEmployee.departments?.name,
            job_title: specificEmployee.job_title
          })
          return specificEmployee
        }
      }

      // Filter by department and designation
      let eligibleEmployees = employees.filter(emp => {
        const empDepartment = emp.departments?.name || emp.department
        const empDesignation = emp.designation || emp.job_title
        
        const departmentMatch = departmentPreferences.some(dep => 
          empDepartment?.toUpperCase() === dep.toUpperCase()
        )
        
        const designationMatch = designationPreferences.some(des => 
          empDesignation?.toUpperCase() === des.toUpperCase()
        )

        return departmentMatch && designationMatch
      })

      console.log(`👥 Found ${eligibleEmployees.length} eligible employees after department/designation filter`)
      eligibleEmployees.forEach(emp => {
        console.log(`👤 Eligible employee:`, {
          id: emp.id,
          name: emp.name || `${emp.first_name} ${emp.last_name}`,
          department: emp.departments?.name,
          job_title: emp.job_title
        })
      })

      // If no eligible employees found, return first active employee
      if (eligibleEmployees.length === 0) {
        const firstActive = employees.find(emp => emp.status === 'active')
        if (firstActive) {
          console.log(`⚠️ No eligible employees found, using first active employee:`, {
            id: firstActive.id,
            name: firstActive.name || `${firstActive.first_name} ${firstActive.last_name}`,
            department: firstActive.departments?.name,
            job_title: firstActive.job_title
          })
          return firstActive
        }
        return null
      }

      // If workload balancing is enabled, get current task counts using PostgreSQL
      if (autoAssignRules?.workloadBalancing) {
        const taskCounts = await Promise.all(
          eligibleEmployees.map(async emp => {
            try {
              const result = await query(`
                SELECT COUNT(*) as count 
                FROM ai_tasks 
                WHERE assigned_to_employee_id = $1 AND status = 'PENDING'
              `, [emp.id])

              const count = parseInt(result.rows[0]?.count || '0')
              return { employee: emp, count }
            } catch (error) {
              console.error(`❌ Error getting task count for employee ${emp.id}:`, error)
              return { employee: emp, count: 0 }
            }
          })
        )

        console.log(`📊 Task counts for eligible employees:`)
        taskCounts.forEach(tc => {
          console.log(`👤 ${tc.employee.name || `${tc.employee.first_name} ${tc.employee.last_name}`}: ${tc.count} tasks`)
        })

        // Sort by task count ascending
        taskCounts.sort((a, b) => a.count - b.count)
        
        const bestEmployee = taskCounts[0].employee
        console.log(`✅ Selected employee with lowest workload:`, {
          id: bestEmployee.id,
          name: bestEmployee.name || `${bestEmployee.first_name} ${bestEmployee.last_name}`,
          department: bestEmployee.departments?.name,
          job_title: bestEmployee.job_title,
          task_count: taskCounts[0].count
        })
        return bestEmployee
      }

      // Otherwise just return first eligible employee
      const selectedEmployee = eligibleEmployees[0]
      console.log(`✅ Selected first eligible employee:`, {
        id: selectedEmployee.id,
        name: selectedEmployee.name || `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
        department: selectedEmployee.departments?.name,
        job_title: selectedEmployee.job_title
      })
      return selectedEmployee

    } catch (error) {
      console.error('❌ Error finding best employee:', error)
      return null
    }
  }

  /**
   * Calculate due date based on SLA hours
   */
  private calculateDueDate(hours: number): string {
    const dueDate = new Date()
    dueDate.setHours(dueDate.getHours() + hours)
    return dueDate.toISOString()
  }

  /**
   * Check if task already exists for this rule and lead using PostgreSQL
   */
  private async checkExistingTask(
    ruleId: string, 
    leadId: number, 
    quotationId?: number
  ): Promise<boolean> {
    try {
      console.log(`🔍 Checking for existing task in PostgreSQL:`, {
        ruleId,
        leadId,
        quotationId
      })

      const result = await query(`
        SELECT id FROM ai_tasks 
        WHERE lead_id = $1 
        AND status = 'PENDING' 
        AND metadata @> $2
        LIMIT 1
      `, [leadId, JSON.stringify({ rule_id: ruleId })])

      const exists = result.rows.length > 0
      console.log(`✅ Existing task check result: ${exists ? 'Found' : 'Not found'}`)
      return exists

    } catch (error) {
      console.error('❌ Exception in checkExistingTask:', error)
      return false
    }
  }

  /**
   * Save generated task to PostgreSQL database
   */
  private async saveTaskToDatabase(
    task: GeneratedTask, 
    rule: BusinessRule, 
    event: LeadTaskTriggerEvent
  ): Promise<boolean> {
    try {
      // Generate unique task number
      const taskNumber = `AI-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      
      console.log(`🎯 Saving task to PostgreSQL:`, {
        title: task.title,
        assigned_to: task.assigned_to_name,
        employee_id: task.assigned_to_employee_id,
        lead_id: task.lead_id,
        task_type: task.task_type,
        task_number: taskNumber
      })
      
      const taskId = uuidv4()
      const now = new Date().toISOString()
      
      const result = await query(`
        INSERT INTO ai_tasks (
          id, task_title, task_description, priority, status, assigned_to, 
          assigned_to_employee_id, assigned_by, lead_id, quotation_id, due_date, 
          category, client_name, business_impact, ai_reasoning, estimated_value, 
          task_type, metadata, created_at
        ) VALUES (
          $1, $2, $3, $4, 'PENDING', $5, $6, $7, $8, $9, $10, 'SALES_FOLLOWUP', 
          $11, $12, $13, $14, $15, $16, $17
        ) RETURNING id
      `, [
        taskId, task.title, task.description, task.priority.toUpperCase(),
        task.assigned_to_name || 'Sales Team', task.assigned_to_employee_id,
        event.triggeredBy || 'AI System', task.lead_id, task.quotation_id,
        task.due_date, task.client_name, task.business_impact, task.ai_reasoning,
        task.estimated_value, task.task_type, JSON.stringify({
          ai_confidence_score: 0.9,
          ai_generated: true,
          rule_id: rule.id,
          rule_name: rule.name,
          task_type: task.task_type,
          department_assigned: task.department_assigned,
          designation_assigned: task.designation_assigned,
          sla_hours: rule.slaHours,
          triggered_by: event.triggeredBy,
          generated_at: now,
          automation_source: `ai_rule_${rule.id}`,
          lead_number: event.leadData.lead_number || `L${task.lead_id}`,
          task_number: taskNumber
        }), now
      ])

      console.log(`✅ Task saved in PostgreSQL: ${task.title} → assigned to: ${task.assigned_to_name}`)
      console.log(`📋 Saved task ID:`, result.rows[0]?.id)
      return true

    } catch (error) {
      console.error('❌ Exception in saveTaskToDatabase:', error)
      console.error('Stack trace:', error?.stack)
      return false
    }
  }

  /**
   * Log task generation event in PostgreSQL
   */
  private async logTaskGeneration(
    task: GeneratedTask | null,
    rule: BusinessRule,
    event: LeadTaskTriggerEvent,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      // Convert any user IDs to UUID format for logging consistency
      const triggeredByUuid = event.triggeredBy ? getUserIdForDatabase(event.triggeredBy) : null
      
      await query(`
        INSERT INTO task_generation_log (
          lead_id, quotation_id, rule_triggered, task_id, success, error_message,
          triggered_by, triggered_by_uuid, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        event.leadId, event.quotationData?.id, rule.id, null, success, error,
        event.triggeredBy || 'system', triggeredByUuid, JSON.stringify({
          rule_name: rule.name,
          event_type: event.eventType,
          lead_status: event.leadData.status,
          task_title: task?.title,
          task_priority: task?.priority,
          estimated_value: task?.estimated_value,
          sla_hours: rule.slaHours,
          department_assigned: task?.department_assigned,
          designation_assigned: task?.designation_assigned,
          ai_reasoning: task?.ai_reasoning
        }), new Date().toISOString()
      ])
    } catch (error) {
      console.error('❌ Error logging task generation:', error)
    }
  }

  /**
   * Get all active employees for task assignment using PostgreSQL
   */
  private async getAllEmployees(): Promise<any[]> {
    try {
      console.log('👥 Fetching all employees from PostgreSQL')
      
      const result = await query(`
        SELECT 
          e.id, e.first_name, e.last_name, e.name, e.status, e.job_title, e.designation,
          d.name as department_name, e.department_id
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.status = 'active'
        ORDER BY e.name, e.first_name
      `)

      const employees = result.rows.map(row => ({
        ...row,
        departments: row.department_name ? { name: row.department_name } : null,
        department: row.department_name
      }))

      console.log(`✅ Retrieved ${employees.length} active employees from PostgreSQL`)
      return employees
    } catch (error) {
      console.error('❌ Error fetching employees:', error)
      return []
    }
  }

  private generateBusinessInsights(result: AITaskGenerationResult, event: LeadTaskTriggerEvent): string[] {
    const insights: string[] = []
    const lead = event.leadData

    if (result.tasksGenerated > 0) {
      insights.push(`🎯 Generated ${result.tasksGenerated} intelligent tasks for ${lead.client_name}`)
    }

    if (lead.estimated_value && lead.estimated_value >= 100000) {
      insights.push(`💰 High-value lead (₹${lead.estimated_value.toLocaleString()}) - executive attention assigned`)
    }

    if (event.eventType === "lead_assigned") {
      insights.push(`👤 Lead assigned to team member - initiating automated workflow`)
    }

    return insights
  }
}

// Export singleton instance
export const leadTaskIntegrationService = LeadTaskIntegrationService.getInstance()
