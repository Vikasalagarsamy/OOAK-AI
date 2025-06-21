import { query } from "@/lib/postgresql-client"

interface DirectBusinessAIResponse {
  response: string
  confidence: number
  sources: string[]
  data_used: {
    leads: number
    quotations: number
    tasks: number
    employees: number
  }
  suggested_actions?: string[]
}

export class DirectBusinessAIService {
  private llmEndpoint = process.env.LLM_ENDPOINT || 'http://127.0.0.1:11434'
  private llmModel = process.env.LLM_MODEL || 'llama3.1:8b'

  async processQuery(query: string, userId: string = 'user'): Promise<DirectBusinessAIResponse> {
    console.log('🤖 Processing business query with direct PostgreSQL access:', query)
    
    const startTime = Date.now()

    try {
      // 1. Get comprehensive business context from PostgreSQL
      const businessContext = await this.getComprehensiveBusinessContext(query)
      
      // 2. Build AI prompt with real business data
      const prompt = this.buildBusinessPrompt(query, businessContext)
      
      // 3. Get AI response
      const aiResponse = await this.generateAIResponse(prompt)
      
      // 4. Parse and structure the response
      const structuredResponse = this.parseResponse(aiResponse, businessContext)
      
      console.log(`✅ Business AI query processed in ${Date.now() - startTime}ms`)
      
      return structuredResponse

    } catch (error) {
      console.error('❌ Error processing business AI query:', error)
      return {
        response: "I apologize, but I encountered an error accessing the business data. Please try again.",
        confidence: 0.0,
        sources: [],
        data_used: { leads: 0, quotations: 0, tasks: 0, employees: 0 }
      }
    }
  }

  private async getComprehensiveBusinessContext(userQuery: string) {
    console.log('📊 Gathering comprehensive business context from PostgreSQL')

    // Determine what data to fetch based on query
    const queryLower = userQuery.toLowerCase()
    const needsLeads = queryLower.includes('lead') || queryLower.includes('client') || queryLower.includes('prospect')
    const needsQuotations = queryLower.includes('quotation') || queryLower.includes('quote') || queryLower.includes('price') || queryLower.includes('amount') || queryLower.includes('revenue')
    const needsTasks = queryLower.includes('task') || queryLower.includes('work') || queryLower.includes('progress') || queryLower.includes('status')
    const needsEmployees = queryLower.includes('employee') || queryLower.includes('team') || queryLower.includes('staff')

    // If query mentions specific names, get all data
    const hasSpecificName = /\b[A-Z][a-z]+\b/.test(userQuery)
    const fetchAll = hasSpecificName || (!needsLeads && !needsQuotations && !needsTasks && !needsEmployees)

    const context: any = {
      leads: [],
      quotations: [],
      tasks: [],
      employees: [],
      summary: ''
    }

    try {
      // Fetch leads from PostgreSQL
      if (needsLeads || fetchAll) {
        console.log('📋 Fetching leads data...')
        const leadsResult = await query(`
          SELECT 
            l.*,
            c.company_name,
            e.first_name || ' ' || e.last_name as assigned_employee
          FROM leads l
          LEFT JOIN companies c ON l.company_id = c.id
          LEFT JOIN employees e ON l.assigned_to = e.id
          ORDER BY l.created_at DESC
          LIMIT 20
        `)
        context.leads = leadsResult.rows || []
      }

      // Fetch quotations from PostgreSQL
      if (needsQuotations || fetchAll) {
        console.log('💰 Fetching quotations data...')
        const quotationsResult = await query(`
          SELECT 
            q.*,
            c.company_name,
            e.first_name || ' ' || e.last_name as created_by_name
          FROM quotations q
          LEFT JOIN companies c ON q.company_id = c.id
          LEFT JOIN employees e ON q.created_by = e.id
          ORDER BY q.created_at DESC
          LIMIT 15
        `)
        context.quotations = quotationsResult.rows || []
      }

      // Fetch tasks from PostgreSQL
      if (needsTasks || fetchAll) {
        console.log('✅ Fetching tasks data...')
        const tasksResult = await query(`
          SELECT 
            t.*,
            e.first_name || ' ' || e.last_name as assigned_to_name
          FROM ai_tasks t
          LEFT JOIN employees e ON t.assigned_to_employee_id = e.id
          ORDER BY t.created_at DESC
          LIMIT 15
        `)
        context.tasks = tasksResult.rows || []
      }

      // Fetch employees from PostgreSQL
      if (needsEmployees || fetchAll) {
        console.log('👥 Fetching employees data...')
        const employeesResult = await query(`
          SELECT 
            e.*,
            d.name as department_name
          FROM employees e
          LEFT JOIN departments d ON e.department_id = d.id
          ORDER BY e.created_at DESC
        `)
        context.employees = employeesResult.rows || []
      }

      // Create summary
      context.summary = `Business Overview: ${context.leads.length} leads, ${context.quotations.length} quotations, ${context.tasks.length} tasks, ${context.employees.length} employees`

      console.log('✅ Business context gathered successfully:', {
        leads: context.leads.length,
        quotations: context.quotations.length,
        tasks: context.tasks.length,
        employees: context.employees.length
      })

      return context

    } catch (error) {
      console.error('❌ Error fetching business context from PostgreSQL:', error)
      return context
    }
  }

  private buildBusinessPrompt(userQuery: string, context: any): string {
    const prompt = `You are the AI assistant for OOAK Photography & Videography business. You have complete access to all business data via PostgreSQL and can provide accurate, specific information.

CURRENT BUSINESS DATA FROM POSTGRESQL:

RECENT LEADS (${context.leads.length} total):
${context.leads.slice(0, 10).map((lead: any, index: number) => 
  `${index + 1}. ${lead.client_name || 'Unknown Client'}
   - Email: ${lead.email || 'Not provided'}
   - Phone: ${lead.phone || 'Not provided'}
   - Company: ${lead.company_name || 'Not provided'}
   - Source: ${lead.source || 'Unknown'}
   - Status: ${lead.status}
   - Estimated Value: ₹${lead.estimated_value || 'Not specified'}
   - Notes: ${lead.notes || 'No notes'}
   - Assigned to: ${lead.assigned_employee || 'Unassigned'}
   - Created: ${new Date(lead.created_at).toLocaleDateString()}`
).join('\n\n')}

RECENT QUOTATIONS (${context.quotations.length} total):
${context.quotations.slice(0, 8).map((quote: any, index: number) => 
  `${index + 1}. ${quote.client_name} - ₹${quote.total_amount}
   - Event Type: ${quote.event_type}
   - Event Date: ${quote.event_date}
   - Location: ${quote.event_location}
   - Services: ${quote.services_included}
   - Status: ${quote.status}
   - Company: ${quote.company_name || 'Individual Client'}
   - Created by: ${quote.created_by_name || 'Unknown'}
   - Created: ${new Date(quote.created_at).toLocaleDateString()}
   - Notes: ${quote.notes || 'No additional notes'}`
).join('\n\n')}

ACTIVE TASKS (${context.tasks.length} total):
${context.tasks.slice(0, 8).map((task: any, index: number) => 
  `${index + 1}. ${task.task_title || task.title}
   - Client: ${task.client_name}
   - Status: ${task.status}
   - Priority: ${task.priority}
   - Description: ${task.task_description || task.description}
   - Estimated Value: ₹${task.estimated_value || 'Not specified'}
   - Business Impact: ${task.business_impact}
   - Assigned to: ${task.assigned_to_name || 'Unassigned'}
   - Due Date: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
   - Created: ${new Date(task.created_at).toLocaleDateString()}
   - AI Reasoning: ${task.ai_reasoning || 'No AI reasoning available'}`
).join('\n\n')}

TEAM MEMBERS (${context.employees.length} total):
${context.employees.map((emp: any, index: number) => 
  `${index + 1}. ${emp.first_name} ${emp.last_name}
   - Email: ${emp.email || 'Not provided'}
   - Phone: ${emp.phone || 'Not provided'}
   - Department: ${emp.department_name || 'Not specified'}
   - Designation: ${emp.job_title || 'Not specified'}
   - Employee ID: ${emp.employee_id || emp.id}`
).join('\n\n')}

BUSINESS INTELLIGENCE RULES:
1. ONLY use the PostgreSQL data provided above - NEVER make up information
2. For specific client names, search through all the data carefully
3. Provide exact amounts, dates, and details from the records
4. If information isn't available in the data, clearly state that
5. Reference specific records when providing information
6. Calculate totals and summaries from the actual data
7. Suggest actionable next steps based on the current business state
8. All data is fresh from PostgreSQL database - highly reliable

USER QUERY: ${userQuery}

Please provide a comprehensive, accurate response using ONLY the PostgreSQL business data provided above. Include specific details, reference exact records, and provide actionable insights based on the current business state. If the query asks about someone or something not in the data, clearly state that you don't have that information in the current records.`

    return prompt
  }

  private async generateAIResponse(prompt: string): Promise<string> {
    try {
      console.log('🧠 Generating AI response using local LLM...')
      
      const response = await fetch(`${this.llmEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.llmModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for more factual responses
            top_p: 0.9,
            max_tokens: 1500
          }
        }),
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`)
      }

      const data = await response.json()
      return data.response || 'No response generated'
    } catch (error) {
      console.error('❌ LLM generation error:', error)
      throw error
    }
  }

  private parseResponse(aiResponse: string, context: any): DirectBusinessAIResponse {
    // Calculate confidence based on response quality
    const confidence = this.calculateConfidence(aiResponse)
    
    // Extract sources mentioned in response
    const sources = this.extractSources(aiResponse)
    
    // Extract suggested actions
    const suggestedActions = this.extractSuggestedActions(aiResponse)

    return {
      response: aiResponse,
      confidence,
      sources,
      data_used: {
        leads: context.leads.length,
        quotations: context.quotations.length,
        tasks: context.tasks.length,
        employees: context.employees.length
      },
      suggested_actions: suggestedActions
    }
  }

  private calculateConfidence(response: string): number {
    // Higher confidence for responses with specific data
    let confidence = 0.5
    
    if (response.includes('₹')) confidence += 0.2 // Contains amounts
    if (response.includes('Created:') || response.includes('Date:')) confidence += 0.1 // Contains dates
    if (response.includes('Status:')) confidence += 0.1 // Contains status info
    if (response.length > 200) confidence += 0.1 // Detailed response
    if (!response.includes("I don't have")) confidence += 0.1 // Has information
    
    return Math.min(confidence, 1.0)
  }

  private extractSources(response: string): string[] {
    const sources = []
    if (response.includes('lead')) sources.push('leads_table')
    if (response.includes('quotation') || response.includes('₹')) sources.push('quotations_table')
    if (response.includes('task')) sources.push('tasks_table')
    if (response.includes('employee') || response.includes('team')) sources.push('employees_table')
    return sources
  }

  private extractSuggestedActions(response: string): string[] {
    const actions = []
    
    // Common business actions based on response content
    if (response.includes('follow up') || response.includes('contact')) {
      actions.push('Schedule follow-up call or meeting')
    }
    if (response.includes('quotation') && response.includes('pending')) {
      actions.push('Send quotation reminder')
    }
    if (response.includes('task') && response.includes('pending')) {
      actions.push('Review pending tasks')
    }
    if (response.includes('revenue') || response.includes('amount')) {
      actions.push('Analyze revenue opportunities')
    }
    
    return actions
  }

  async getSystemHealth(): Promise<{
    ai_status: 'healthy' | 'degraded' | 'offline'
    llm_connection: boolean
    data_access: boolean
    business_data_summary: any
  }> {
    try {
      console.log('🏥 Checking Direct Business AI system health...')

      // Test LLM connection
      const llmTest = await fetch(`${this.llmEndpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      const llmHealthy = llmTest.ok

      // Test PostgreSQL database access
      let dataAccess = false
      let businessDataSummary = {}

      try {
        const [
          leadsCount,
          quotationsCount,
          tasksCount,
          employeesCount
        ] = await Promise.all([
          query('SELECT COUNT(*) as count FROM leads'),
          query('SELECT COUNT(*) as count FROM quotations'),
          query('SELECT COUNT(*) as count FROM ai_tasks'),
          query('SELECT COUNT(*) as count FROM employees')
        ])

        dataAccess = true
        businessDataSummary = {
          total_leads: parseInt(leadsCount.rows[0]?.count || '0'),
          total_quotations: parseInt(quotationsCount.rows[0]?.count || '0'),
          total_tasks: parseInt(tasksCount.rows[0]?.count || '0'),
          total_employees: parseInt(employeesCount.rows[0]?.count || '0')
        }

        console.log('✅ PostgreSQL data access successful:', businessDataSummary)
      } catch (dbError) {
        console.error('❌ PostgreSQL data access failed:', dbError)
        dataAccess = false
      }

      const aiStatus = llmHealthy && dataAccess ? 'healthy' : 'degraded'

      return {
        ai_status: aiStatus,
        llm_connection: llmHealthy,
        data_access: dataAccess,
        business_data_summary: businessDataSummary
      }
    } catch (error) {
      console.error('❌ System health check failed:', error)
      return {
        ai_status: 'offline',
        llm_connection: false,
        data_access: false,
        business_data_summary: {}
      }
    }
  }
}

// Export singleton instance
export const directBusinessAIService = new DirectBusinessAIService()