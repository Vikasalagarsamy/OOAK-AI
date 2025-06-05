import { createClient } from '@/lib/supabase'
import type { LeadStatus } from '@/types/follow-up'

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
  private supabase = createClient()
  
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
      console.log(`🎯 Processing lead event: ${event.eventType} for lead ${event.leadId}`)
      
      const result: AITaskGenerationResult = {
        success: true,
        tasksGenerated: 0,
        tasks: [],
        businessInsights: []
      }

      // Get employees for assignment
      const employees = await this.getAllEmployees()
      
      // Process each applicable business rule
      for (const rule of this.businessRules.filter(r => r.enabled)) {
        if (rule.triggerCondition(event)) {
          console.log(`✅ Rule triggered: ${rule.name}`)
          
          // Check if task already exists for this rule + lead combination
          const existingTask = await this.checkExistingTask(rule.id, event.leadId, event.quotationData?.id)
          
          if (!existingTask) {
            try {
              const task = await rule.taskGenerator(event, employees)
              
              if (task) {
                // Save task to database
                const savedTask = await this.saveTaskToDatabase(task, rule, event)
                
                if (savedTask) {
                  result.tasks.push(task)
                  result.tasksGenerated++
                  
                  console.log(`✅ Generated task: ${task.title}`)
                  
                  // Log the generation event
                  await this.logTaskGeneration(task, rule, event, true)
                } else {
                  console.error(`❌ Failed to save task: ${task.title}`)
                  await this.logTaskGeneration(task, rule, event, false, 'Database save failed')
                }
              }
            } catch (error: any) {
              console.error(`❌ Failed to generate task for rule ${rule.id}:`, error)
              await this.logTaskGeneration(null, rule, event, false, error?.message || 'Unknown error')
            }
          } else {
            console.log(`⏭️ Task already exists for rule ${rule.id} and lead ${event.leadId}`)
          }
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
    const assignedEmployee = await this.findBestEmployee(
      employees, 
      ['SALES', 'SEO'], 
      ['Sales Head', 'Sales Resource', 'SEO'],
      { workloadBalancing: true }
    )

    return {
      id: `initial-contact-${lead.id}-${Date.now()}`,
      title: `Initial contact with ${lead.client_name}`,
      description: `Make initial contact with ${lead.client_name} (Lead #${lead.lead_number}). Introduce yourself, understand their requirements, and schedule a detailed discussion. This is a fresh lead that needs immediate attention.`,
      task_type: 'lead_follow_up',
      priority: 'medium',
      assigned_to_employee_id: assignedEmployee?.id,
      assigned_to_name: assignedEmployee?.name,
      lead_id: lead.id,
      client_name: lead.client_name,
      due_date: this.calculateDueDate(24), // 24 hours
      estimated_value: lead.estimated_value || 30000,
      sla_hours: 24,
      ai_reasoning: `New lead assigned and requires immediate initial contact within 24 hours. Client: ${lead.client_name}. Estimated value: ₹${(lead.estimated_value || 30000).toLocaleString()}. Critical for first impression and relationship building.`,
      business_impact: `First Impression • Relationship Building • Pipeline Entry • Revenue Opportunity: ₹${(lead.estimated_value || 30000).toLocaleString()}`,
      department_assigned: assignedEmployee?.department,
      designation_assigned: assignedEmployee?.designation
    }
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
   * Find best employee for task assignment based on department, designation, and workload
   */
  private async findBestEmployee(
    employees: any[], 
    preferredDepartments: string[], 
    preferredDesignations: string[],
    options: {
      workloadBalancing?: boolean
      experienceLevel?: 'junior' | 'senior' | 'expert'
      specificAssignee?: string
    } = {}
  ): Promise<any> {
    // If specific assignee is mentioned, find them first
    if (options.specificAssignee) {
      const specificEmployee = employees.find(emp => 
        emp.name === options.specificAssignee || 
        emp.full_name === options.specificAssignee
      )
      if (specificEmployee) return specificEmployee
    }

    // Filter by department
    let candidates = employees.filter(emp => 
      preferredDepartments.some(dept => 
        emp.department?.toUpperCase().includes(dept.toUpperCase())
      )
    )

    // If no department match, fall back to all employees
    if (candidates.length === 0) {
      candidates = employees
    }

    // Filter by designation
    if (preferredDesignations.length > 0) {
      const designationCandidates = candidates.filter(emp =>
        preferredDesignations.some(designation =>
          emp.designation?.toLowerCase().includes(designation.toLowerCase())
        )
      )
      
      if (designationCandidates.length > 0) {
        candidates = designationCandidates
      }
    }

    // Apply experience level filter
    if (options.experienceLevel) {
      const experiencePriority = {
        'expert': ['head', 'manager', 'senior', 'lead'],
        'senior': ['senior', 'head', 'lead'],
        'junior': ['junior', 'associate', 'resource']
      }
      
      const expKeywords = experiencePriority[options.experienceLevel] || []
      const experienceCandidates = candidates.filter(emp =>
        expKeywords.some(keyword =>
          emp.designation?.toLowerCase().includes(keyword)
        )
      )
      
      if (experienceCandidates.length > 0) {
        candidates = experienceCandidates
      }
    }

    // If workload balancing is enabled, get current task counts
    if (options.workloadBalancing && candidates.length > 1) {
      // TODO: Implement actual workload checking
      // For now, return a random candidate
      return candidates[Math.floor(Math.random() * candidates.length)]
    }

    // Return first candidate or fallback
    return candidates[0] || employees[0] || null
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
   * Check if task already exists for this rule and lead
   */
  private async checkExistingTask(
    ruleId: string, 
    leadId: number, 
    quotationId?: number
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('ai_tasks')
        .select('id')
        .eq('lead_id', leadId)
        .ilike('ai_reasoning', `%${ruleId}%`)
        .limit(1)

      if (error) {
        console.error('Error checking existing task:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error in checkExistingTask:', error)
      return false
    }
  }

  /**
   * Save generated task to database
   */
  private async saveTaskToDatabase(
    task: GeneratedTask, 
    rule: BusinessRule, 
    event: LeadTaskTriggerEvent
  ): Promise<boolean> {
    try {
      // Generate unique task number
      const taskNumber = `AI-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      
      const { error } = await this.supabase
        .from('ai_tasks')
        .insert({
          task_number: taskNumber,
          title: task.title,
          description: task.description,
          priority: task.priority.toUpperCase(),
          status: 'PENDING',
          assigned_to: task.assigned_to_employee_id,
          created_by: 1, // System generated
          lead_id: task.lead_id,
          quotation_id: task.quotation_id,
          due_date: task.due_date,
          company_id: event.leadData.company_id || 1,
          branch_id: event.leadData.branch_id || 1,
          category: 'AI_GENERATED',
          estimated_hours: rule.slaHours,
          business_impact: task.business_impact.substring(0, 50), // Truncate to fit VARCHAR(50)
          automation_source: `ai_rule_${rule.id}`,
          metadata: {
            ai_reasoning: task.ai_reasoning,
            ai_confidence_score: 0.9,
            ai_generated: true,
            rule_id: rule.id,
            rule_name: rule.name,
            client_name: task.client_name,
            task_type: task.task_type,
            department_assigned: task.department_assigned,
            designation_assigned: task.designation_assigned,
            estimated_value: task.estimated_value,
            sla_hours: rule.slaHours,
            triggered_by: event.triggeredBy,
            generated_at: new Date().toISOString()
          }
        })

      if (error) {
        console.error('❌ Database error saving task:', error)
        return false
      }

      console.log(`✅ Task saved to database: ${taskNumber}`)
      return true
    } catch (error) {
      console.error('❌ Exception in saveTaskToDatabase:', error)
      return false
    }
  }

  /**
   * Log task generation event
   */
  private async logTaskGeneration(
    task: GeneratedTask | null,
    rule: BusinessRule,
    event: LeadTaskTriggerEvent,
    success: boolean,
    error?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('task_generation_log')
        .insert({
          lead_id: event.leadId,
          quotation_id: event.quotationData?.id,
          rule_triggered: rule.id,
          task_id: null, // Will be updated if task is created successfully
          success,
          error_message: error,
          triggered_by: event.triggeredBy || 'system',
          metadata: {
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
          }
        })
    } catch (error) {
      console.error('❌ Error logging task generation:', error)
    }
  }

  /**
   * Get all employees for assignment
   */
  private async getAllEmployees(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('employees')
        .select('id, name, department, designation, full_name, user_id')
        .eq('active', true)

      if (error) {
        console.error('Error fetching employees:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllEmployees:', error)
      return []
    }
  }

  /**
   * Map priority to business impact
   */
  private mapPriorityToBusinessImpact(priority: string): string {
    const mapping: { [key: string]: string } = {
      'urgent': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    }
    return mapping[priority] || 'medium'
  }

  /**
   * Generate business insights from task generation
   */
  private generateBusinessInsights(
    result: AITaskGenerationResult, 
    event: LeadTaskTriggerEvent
  ): string[] {
    const insights: string[] = []
    const lead = event.leadData

    if (result.tasksGenerated > 0) {
      insights.push(`🎯 Generated ${result.tasksGenerated} intelligent tasks for ${lead.client_name}`)
    }

    if (lead.estimated_value && lead.estimated_value >= 100000) {
      insights.push(`💰 High-value lead (₹${lead.estimated_value.toLocaleString()}) - executive attention assigned`)
    }

    if (event.eventType === 'lead_assigned') {
      insights.push(`⚡ Lead assignment trigger activated - 24-hour SLA for initial contact`)
    }

    if (event.eventType === 'quotation_sent') {
      insights.push(`📊 Quotation follow-up automation activated - progressive escalation enabled`)
    }

    if (result.tasksGenerated === 0) {
      insights.push(`ℹ️ No new tasks generated - existing tasks may already cover this lead`)
    }

    return insights
  }

  /**
   * Get lead task analytics
   */
  async getLeadTaskAnalytics(leadId: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('lead_task_analytics')
        .select('*')
        .eq('lead_id', leadId)
        .single()

      if (error) {
        console.error('Error fetching lead task analytics:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getLeadTaskAnalytics:', error)
      return null
    }
  }

  /**
   * Get task generation summary for dashboard
   */
  async getTaskGenerationSummary(): Promise<string> {
    try {
      const { data: recentLogs, error } = await this.supabase
        .from('task_generation_log')
        .select('*')
        .gte('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('generated_at', { ascending: false })

      if (error) {
        console.error('Error fetching task generation summary:', error)
        return 'Unable to fetch task generation summary'
      }

      const totalTasks = recentLogs?.length || 0
      const successfulTasks = recentLogs?.filter(log => log.success).length || 0
      const totalValue = recentLogs?.reduce((sum, log) => sum + (log.estimated_value || 0), 0) || 0

      return `
🤖 **AI LEAD-TASK INTEGRATION SUMMARY (24h)**

**Tasks Generated:** ${totalTasks}
**Success Rate:** ${totalTasks > 0 ? Math.round((successfulTasks / totalTasks) * 100) : 0}%
**Revenue Protected:** ₹${totalValue.toLocaleString()}

**Recent Activity:**
${recentLogs?.slice(0, 5).map(log => 
  `• ${log.trigger_event}: ${log.success ? '✅' : '❌'} ${log.business_rule_applied}`
).join('\n') || '• No recent activity'}

**System Status:** 🟢 Lead-Task automation operational
`
    } catch (error) {
      console.error('Error generating task summary:', error)
      return 'Error generating summary'
    }
  }
} 