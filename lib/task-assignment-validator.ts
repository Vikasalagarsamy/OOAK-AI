import { query, transaction } from '@/lib/postgresql-client'

export interface TaskAssignmentRule {
  taskType: string
  assignmentLogic: (context: TaskContext) => Promise<AssignmentResult>
  fallbackEmployee?: number
  validationRules: ValidationRule[]
}

export interface TaskContext {
  leadId?: number
  quotationId?: number
  clientName: string
  taskType: string
  originalData?: any
}

export interface AssignmentResult {
  employeeId: number
  employeeName: string
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  warnings?: string[]
}

export interface ValidationRule {
  name: string
  validate: (assignment: AssignmentResult, context: TaskContext) => Promise<ValidationResult>
}

export interface ValidationResult {
  isValid: boolean
  errorMessage?: string
  warningMessage?: string
}

export class TaskAssignmentValidator {
  
  // 🎯 ASSIGNMENT RULES - Clear, predictable logic
  private assignmentRules: TaskAssignmentRule[] = [
    {
      taskType: 'quotation_revision',
      assignmentLogic: this.assignQuotationRevision.bind(this),
      fallbackEmployee: 6, // Sridhar K as fallback
      validationRules: [
        {
          name: 'lead_owner_validation',
          validate: this.validateLeadOwnership.bind(this)
        },
        {
          name: 'employee_exists_validation', 
          validate: this.validateEmployeeExists.bind(this)
        }
      ]
    },
    {
      taskType: 'quotation_approval',
      assignmentLogic: this.assignQuotationApproval.bind(this),
      fallbackEmployee: 7, // Durga Devi (Sales Head)
      validationRules: [
        {
          name: 'sales_head_validation',
          validate: this.validateSalesHeadAssignment.bind(this)
        }
      ]
    },
    {
      taskType: 'lead_follow_up',
      assignmentLogic: this.assignLeadFollowUp.bind(this),
      fallbackEmployee: 6, // Sridhar K as fallback
      validationRules: [
        {
          name: 'lead_owner_validation',
          validate: this.validateLeadOwnership.bind(this)
        }
      ]
    }
  ]

  /**
   * 🎯 MAIN ASSIGNMENT FUNCTION - Single source of truth
   */
  async assignTask(context: TaskContext): Promise<AssignmentResult> {
    console.log('🎯 TaskAssignmentValidator: Processing assignment for:', context)
    
    try {
      // Find the appropriate rule
      const rule = this.assignmentRules.find(r => r.taskType === context.taskType)
      
      if (!rule) {
        console.warn('⚠️ No assignment rule found for task type:', context.taskType)
        return this.getFallbackAssignment(context, 'No specific rule found')
      }

      // Execute assignment logic
      const assignment = await rule.assignmentLogic(context)
      console.log('📋 Initial assignment result:', assignment)

      // Validate the assignment
      const validationResults = await Promise.all(
        rule.validationRules.map(validation => validation.validate(assignment, context))
      )

      const failedValidations = validationResults.filter(v => !v.isValid)
      
      if (failedValidations.length > 0) {
        console.error('❌ Assignment validation failed:', failedValidations)
        
        // Use fallback assignment
        const fallbackAssignment = await this.getFallbackAssignment(
          context, 
          `Validation failed: ${failedValidations.map(f => f.errorMessage).join(', ')}`
        )
        
        return {
          ...fallbackAssignment,
          warnings: [`Original assignment failed validation: ${failedValidations.map(f => f.errorMessage).join(', ')}`]
        }
      }

      // Add any warnings
      const warnings = validationResults
        .filter(v => v.warningMessage)
        .map(v => v.warningMessage!)

      return {
        ...assignment,
        warnings: warnings.length > 0 ? warnings : undefined
      }

    } catch (error) {
      console.error('❌ Task assignment error:', error)
      return this.getFallbackAssignment(context, `Assignment error: ${error}`)
    }
  }

  /**
   * 🔄 QUOTATION REVISION ASSIGNMENT - Always to lead owner
   */
  private async assignQuotationRevision(context: TaskContext): Promise<AssignmentResult> {
    console.log('🔄 Assigning quotation revision task...')
    
    // Method 1: Find by quotation_id
    if (context.quotationId) {
      try {
        const result = await query(
          'SELECT lead_id FROM quotations WHERE id = $1',
          [context.quotationId]
        )
        
        if (result.rows.length > 0) {
          const leadOwner = await this.getLeadOwner(result.rows[0].lead_id)
          if (leadOwner) {
            return {
              employeeId: leadOwner.id,
              employeeName: leadOwner.name,
              confidence: 'high',
              reasoning: `Assigned to lead owner (Lead ID: ${result.rows[0].lead_id})`
            }
          }
        }
      } catch (error) {
        console.error('❌ Error finding quotation:', error)
      }
    }

    // Method 2: Find by lead_id directly
    if (context.leadId) {
      const leadOwner = await this.getLeadOwner(context.leadId)
      if (leadOwner) {
        return {
          employeeId: leadOwner.id,
          employeeName: leadOwner.name,
          confidence: 'high',
          reasoning: `Assigned to lead owner (Lead ID: ${context.leadId})`
        }
      }
    }

    throw new Error('Could not determine lead owner for quotation revision')
  }

  /**
   * ✅ QUOTATION APPROVAL ASSIGNMENT - Always to Sales Head
   */
  private async assignQuotationApproval(context: TaskContext): Promise<AssignmentResult> {
    console.log('✅ Assigning quotation approval task...')
    
    const salesHead = await this.getSalesHead()
    if (!salesHead) {
      throw new Error('Sales Head not found')
    }

    return {
      employeeId: salesHead.id,
      employeeName: salesHead.name,
      confidence: 'high',
      reasoning: 'Assigned to Sales Head for approval'
    }
  }

  /**
   * 📞 LEAD FOLLOW-UP ASSIGNMENT - Always to lead owner
   */
  private async assignLeadFollowUp(context: TaskContext): Promise<AssignmentResult> {
    console.log('📞 Assigning lead follow-up task...')
    
    if (!context.leadId) {
      throw new Error('Lead ID required for lead follow-up assignment')
    }

    const leadOwner = await this.getLeadOwner(context.leadId)
    if (!leadOwner) {
      throw new Error(`Lead owner not found for Lead ID: ${context.leadId}`)
    }

    return {
      employeeId: leadOwner.id,
      employeeName: leadOwner.name,
      confidence: 'high',
      reasoning: `Assigned to lead owner (Lead ID: ${context.leadId})`
    }
  }

  /**
   * 🔍 VALIDATION FUNCTIONS
   */
  private async validateLeadOwnership(assignment: AssignmentResult, context: TaskContext): Promise<ValidationResult> {
    if (!context.leadId) {
      return { isValid: true, warningMessage: 'No lead ID provided for ownership validation' }
    }

    const leadOwner = await this.getLeadOwner(context.leadId)
    if (!leadOwner) {
      return { isValid: false, errorMessage: `Lead owner not found for Lead ID: ${context.leadId}` }
    }

    if (assignment.employeeId !== leadOwner.id) {
      return { 
        isValid: false, 
        errorMessage: `Assignment mismatch: Task assigned to ${assignment.employeeName} (${assignment.employeeId}) but lead owner is ${leadOwner.name} (${leadOwner.id})` 
      }
    }

    return { isValid: true }
  }

  private async validateEmployeeExists(assignment: AssignmentResult, context: TaskContext): Promise<ValidationResult> {
    try {
      const result = await query(
        'SELECT id, first_name, last_name FROM employees WHERE id = $1',
        [assignment.employeeId]
      )

      if (!result.rows.length) {
        return { isValid: false, errorMessage: `Employee ID ${assignment.employeeId} does not exist` }
      }

      return { isValid: true }
    } catch (error) {
      console.error('❌ Error validating employee exists:', error)
      return { isValid: false, errorMessage: `Error validating employee ID ${assignment.employeeId}` }
    }
  }

  private async validateSalesHeadAssignment(assignment: AssignmentResult, context: TaskContext): Promise<ValidationResult> {
    const salesHead = await this.getSalesHead()
    if (!salesHead) {
      return { isValid: false, errorMessage: 'Sales Head not found in system' }
    }

    if (assignment.employeeId !== salesHead.id) {
      return { 
        isValid: false, 
        errorMessage: `Quotation approval must be assigned to Sales Head (${salesHead.name}), not ${assignment.employeeName}` 
      }
    }

    return { isValid: true }
  }

  /**
   * 🆘 FALLBACK ASSIGNMENT
   */
  private async getFallbackAssignment(context: TaskContext, reason: string): Promise<AssignmentResult> {
    console.warn('🆘 Using fallback assignment:', reason)
    
    const rule = this.assignmentRules.find(r => r.taskType === context.taskType)
    const fallbackEmployeeId = rule?.fallbackEmployee || 6 // Default to Sridhar K
    
    try {
      const result = await query(
        'SELECT id, first_name, last_name FROM employees WHERE id = $1',
        [fallbackEmployeeId]
      )

      if (!result.rows.length) {
        throw new Error(`Fallback employee ID ${fallbackEmployeeId} not found`)
      }

      const employee = result.rows[0]
      return {
        employeeId: employee.id,
        employeeName: `${employee.first_name} ${employee.last_name}`.trim(),
        confidence: 'low',
        reasoning: `Fallback assignment: ${reason}`,
        warnings: [`Used fallback assignment due to: ${reason}`]
      }
    } catch (error) {
      console.error('❌ Error getting fallback assignment:', error)
      throw new Error(`Failed to get fallback assignment: ${error}`)
    }
  }

  /**
   * 🔧 HELPER FUNCTIONS
   */
  private async getLeadOwner(leadId: number): Promise<{id: number, name: string} | null> {
    try {
      const result = await query(
        'SELECT assigned_to FROM leads WHERE id = $1',
        [leadId]
      )

      if (!result.rows.length || !result.rows[0].assigned_to) {
        return null
      }

      const employeeResult = await query(
        'SELECT id, first_name, last_name FROM employees WHERE id = $1',
        [result.rows[0].assigned_to]
      )

      if (!employeeResult.rows.length) {
        return null
      }

      const employee = employeeResult.rows[0]
      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`.trim()
      }
    } catch (error) {
      console.error('❌ Error getting lead owner:', error)
      return null
    }
  }

  private async getSalesHead(): Promise<{id: number, name: string} | null> {
    try {
      const result = await query(
        `SELECT id, first_name, last_name FROM employees 
         WHERE job_title ILIKE '%sales%head%' OR job_title ILIKE '%head%sales%' 
         LIMIT 1`
      )

      if (!result.rows.length) {
        return null
      }

      const employee = result.rows[0]
      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`.trim()
      }
    } catch (error) {
      console.error('❌ Error getting sales head:', error)
      return null
    }
  }
}

// 🎯 SINGLETON INSTANCE
export const taskAssignmentValidator = new TaskAssignmentValidator() 