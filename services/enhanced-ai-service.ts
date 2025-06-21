import { businessIntelligenceService, type Communication, type BusinessEntity, type KnowledgeItem } from './universal-business-intelligence-service'
import { query, transaction } from '@/lib/postgresql-client'

// Import the LLM service class directly
class LLMServiceWrapper {
  private config = {
    provider: 'ollama' as const,
    endpoint: process.env.LLM_ENDPOINT || 'http://127.0.0.1:11434',
    model: process.env.LLM_MODEL || 'llama3.1:8b',
    timeout: parseInt(process.env.LLM_TIMEOUT || '60000'),
    maxRetries: parseInt(process.env.LLM_MAX_RETRIES || '3')
  }

  async generateCompletion(prompt: string): Promise<{ content: string }> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000
          }
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`)
      }

      const data = await response.json()
      return { content: data.response || 'No response generated' }
    } catch (error) {
      console.error('❌ LLM generation error:', error)
      return { content: 'I apologize, but I cannot generate a response at the moment. Please try again.' }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }
}

interface EnhancedAIResponse {
  response: string
  confidence: number
  sources: string[]
  context_used: {
    communications: number
    knowledge_items: number
    entities: number
  }
  suggested_actions?: string[]
  follow_up_questions?: string[]
}

interface BusinessContext {
  current_projects: any[]
  active_leads: any[]
  recent_quotations: any[]
  team_members: BusinessEntity[]
  client_relationships: any[]
}

export class EnhancedAIService {
  private llmService = new LLMServiceWrapper()

  // ============================
  // MAIN AI QUERY PROCESSING - NOW 100% POSTGRESQL
  // ============================

  async processQuery(
    query: string,
    userId: string,
    sessionId?: string
  ): Promise<EnhancedAIResponse> {
    console.log('🤖 Processing enhanced AI query via PostgreSQL:', query)
    
    const startTime = Date.now()

    try {
      // 1. Get smart context for the query from PostgreSQL
      const context = await businessIntelligenceService.getSmartContextForQuery(query, userId, 20)
      
      // 2. Get current business context from PostgreSQL
      const businessContext = await this.getCurrentBusinessContext()
      
      // 3. Get user's AI session context from PostgreSQL
      const userContext = await businessIntelligenceService.getAIContextForUser(userId)
      
      // 4. Build comprehensive prompt
      const enhancedPrompt = await this.buildEnhancedPrompt(
        query,
        context,
        businessContext,
        userContext
      )
      
      // 5. Get AI response
      const llmResponse = await this.llmService.generateCompletion(enhancedPrompt)
      const aiResponse = llmResponse.content
      
      // 6. Extract structured information from response
      const structuredResponse = await this.parseAIResponse(aiResponse)
      
      // 7. Record the query and response in PostgreSQL
      await this.recordAIQuery({
        session_id: sessionId,
        user_query: query,
        query_intent: await this.extractIntent(query),
        query_entities: await this.extractEntities(query),
        context_sources: [
          ...context.relevant_communications.map(c => ({ type: 'communication', id: c.id })),
          ...context.relevant_knowledge.map(k => ({ type: 'knowledge', id: k.id })),
          ...context.relevant_entities.map(e => ({ type: 'entity', id: e.id }))
        ],
        retrieved_communications: context.relevant_communications.length,
        retrieved_knowledge_items: context.relevant_knowledge.length,
        ai_response: structuredResponse.response,
        response_confidence: structuredResponse.confidence,
        response_sources: structuredResponse.sources,
        processing_time_ms: Date.now() - startTime,
        tokens_used: this.estimateTokens(enhancedPrompt + structuredResponse.response),
        user_id: userId
      })

      console.log(`✅ AI query processed via PostgreSQL in ${Date.now() - startTime}ms`)

      return {
        ...structuredResponse,
        context_used: {
          communications: context.relevant_communications.length,
          knowledge_items: context.relevant_knowledge.length,
          entities: context.relevant_entities.length
        }
      }

    } catch (error) {
      console.error('❌ Error processing enhanced AI query via PostgreSQL:', error)
      return {
        response: "I apologize, but I encountered an error while processing your request. Please try again.",
        confidence: 0.0,
        sources: [],
        context_used: { communications: 0, knowledge_items: 0, entities: 0 }
      }
    }
  }

  // ============================
  // CONTEXT BUILDING - POSTGRESQL ENHANCED
  // ============================

  private async buildEnhancedPrompt(
    query: string,
    context: any,
    businessContext: BusinessContext,
    userContext: any
  ): Promise<string> {
    
    const prompt = `You are the AI assistant for a photography and videography business. You have complete access to all business communications, client interactions, project details, and company knowledge.

CURRENT BUSINESS STATUS (PostgreSQL):
- Active Projects: ${businessContext.current_projects.length}
- Active Leads: ${businessContext.active_leads.length}
- Recent Quotations: ${businessContext.recent_quotations.length}
- Team Members: ${businessContext.team_members.length}

RECENT COMMUNICATIONS CONTEXT (PostgreSQL):
${context.relevant_communications.slice(0, 5).map((comm: Communication) => 
  `- ${comm.channel_type.toUpperCase()}: ${comm.sender_name || comm.sender_id} → ${comm.recipient_name || comm.recipient_id}
    Content: ${comm.content_text?.substring(0, 200)}...
    Context: ${comm.business_context || 'General'}
    Sentiment: ${comm.ai_sentiment || 'Unknown'}
    Date: ${new Date(comm.sent_at).toLocaleDateString()}`
).join('\n')}

RELEVANT KNOWLEDGE BASE (PostgreSQL):
${context.relevant_knowledge.slice(0, 3).map((knowledge: KnowledgeItem) =>
  `- ${knowledge.title}
    Area: ${knowledge.business_area}
    Summary: ${knowledge.summary || knowledge.content.substring(0, 150)}...
    Importance: ${knowledge.importance_score}/1.0`
).join('\n')}

CLIENT & TEAM CONTEXT (PostgreSQL):
${context.relevant_entities.slice(0, 5).map((entity: BusinessEntity) =>
  `- ${entity.name} (${entity.entity_type})
    Contact: ${entity.primary_phone || entity.email || entity.whatsapp_number}
    Status: ${entity.entity_status}
    Last Contact: ${entity.metadata?.last_contact_date ? new Date(entity.metadata.last_contact_date).toLocaleDateString() : 'Unknown'}`
).join('\n')}

USER QUERY: ${query}

Please provide a comprehensive, helpful response based on the PostgreSQL business data and context provided. Be specific and reference actual data when possible.`

    return prompt
  }

  // ============================
  // BUSINESS CONTEXT - POSTGRESQL QUERIES
  // ============================

  private async getCurrentBusinessContext(): Promise<BusinessContext> {
    try {
      console.log('📊 Fetching current business context from PostgreSQL...')
      
      // Parallel PostgreSQL queries for business context
      const [projectsResult, leadsResult, quotationsResult, teamResult, clientsResult] = await Promise.allSettled([
        this.getCurrentProjects(),
        this.getActiveLeads(),
        this.getRecentQuotations(),
        this.getTeamMembers(),
        this.getClientRelationships()
      ])

      return {
        current_projects: projectsResult.status === 'fulfilled' ? projectsResult.value : [],
        active_leads: leadsResult.status === 'fulfilled' ? leadsResult.value : [],
        recent_quotations: quotationsResult.status === 'fulfilled' ? quotationsResult.value : [],
        team_members: teamResult.status === 'fulfilled' ? teamResult.value : [],
        client_relationships: clientsResult.status === 'fulfilled' ? clientsResult.value : []
      }
    } catch (error) {
      console.error('❌ Error fetching business context from PostgreSQL:', error)
      return {
        current_projects: [],
        active_leads: [],
        recent_quotations: [],
        team_members: [],
        client_relationships: []
      }
    }
  }

  private async getCurrentProjects(): Promise<any[]> {
    try {
      const result = await query(`
        SELECT 
          q.id,
          q.quotation_number,
          q.client_name,
          q.total_amount,
          q.status,
          q.workflow_status,
          q.created_at,
          q.event_date,
          c.name as company_name
        FROM quotations q
        LEFT JOIN companies c ON q.company_id = c.id
        WHERE q.status IN ('approved', 'in_progress', 'confirmed')
          AND q.created_at >= NOW() - INTERVAL '90 days'
        ORDER BY q.created_at DESC
        LIMIT 20
      `)
      
      return result.rows
    } catch (error) {
      console.error('❌ Error fetching current projects:', error)
      return []
    }
  }

  private async getActiveLeads(): Promise<any[]> {
    try {
      const result = await query(`
        SELECT 
          l.id,
          l.contact_name,
          l.phone,
          l.email,
          l.lead_source,
          l.status,
          l.created_at,
          c.name as company_name,
          e.name as assigned_to_name
        FROM leads l
        LEFT JOIN companies c ON l.company_id = c.id
        LEFT JOIN employees e ON l.assigned_to = e.id
        WHERE l.status NOT IN ('closed', 'converted', 'rejected')
          AND l.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY l.created_at DESC
        LIMIT 15
      `)
      
      return result.rows
    } catch (error) {
      console.error('❌ Error fetching active leads:', error)
      return []
    }
  }

  private async getRecentQuotations(): Promise<any[]> {
    try {
      const result = await query(`
        SELECT 
          q.id,
          q.quotation_number,
          q.client_name,
          q.total_amount,
          q.status,
          q.created_at,
          q.event_date,
          c.name as company_name
        FROM quotations q
        LEFT JOIN companies c ON q.company_id = c.id
        WHERE q.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY q.created_at DESC
        LIMIT 10
      `)
      
      return result.rows
    } catch (error) {
      console.error('❌ Error fetching recent quotations:', error)
      return []
    }
  }

  private async getTeamMembers(): Promise<BusinessEntity[]> {
    try {
      const result = await query(`
        SELECT 
          e.id,
          e.name,
          e.email,
          e.phone,
          e.position,
          e.department,
          e.is_active,
          d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON e.department = d.id
        WHERE e.is_active = true
        ORDER BY e.name
      `)
      
      return result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        entity_type: 'employee' as const,
        email: row.email,
        primary_phone: row.phone,
        entity_status: row.is_active ? 'active' : 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          position: row.position,
          department: row.department_name || row.department
        }
      }))
    } catch (error) {
      console.error('❌ Error fetching team members:', error)
      return []
    }
  }

  private async getClientRelationships(): Promise<any[]> {
    try {
      const result = await query(`
        SELECT DISTINCT
          q.client_name,
          q.client_email,
          q.client_phone,
          COUNT(q.id) as total_quotations,
          SUM(CASE WHEN q.status = 'approved' THEN q.total_amount ELSE 0 END) as total_revenue,
          MAX(q.created_at) as last_interaction,
          c.name as company_name
        FROM quotations q
        LEFT JOIN companies c ON q.company_id = c.id
        WHERE q.created_at >= NOW() - INTERVAL '365 days'
        GROUP BY q.client_name, q.client_email, q.client_phone, c.name
        HAVING COUNT(q.id) > 0
        ORDER BY last_interaction DESC
        LIMIT 20
      `)
      
      return result.rows
    } catch (error) {
      console.error('❌ Error fetching client relationships:', error)
      return []
    }
  }

  // ============================
  // AI QUERY RECORDING - POSTGRESQL
  // ============================

  private async recordAIQuery(queryData: {
    session_id?: string
    user_query: string
    query_intent: string
    query_entities: Record<string, any>
    context_sources: Array<{ type: string; id: string }>
    retrieved_communications: number
    retrieved_knowledge_items: number
    ai_response: string
    response_confidence: number
    response_sources: string[]
    processing_time_ms: number
    tokens_used: number
    user_id: string
  }): Promise<void> {
    try {
      await query(`
        INSERT INTO ai_query_logs (
          session_id,
          user_id,
          user_query,
          query_intent,
          query_entities,
          context_sources,
          retrieved_communications,
          retrieved_knowledge_items,
          ai_response,
          response_confidence,
          response_sources,
          processing_time_ms,
          tokens_used,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      `, [
        queryData.session_id,
        queryData.user_id,
        queryData.user_query,
        queryData.query_intent,
        JSON.stringify(queryData.query_entities),
        JSON.stringify(queryData.context_sources),
        queryData.retrieved_communications,
        queryData.retrieved_knowledge_items,
        queryData.ai_response,
        queryData.response_confidence,
        JSON.stringify(queryData.response_sources),
        queryData.processing_time_ms,
        queryData.tokens_used
      ])
      
      console.log('✅ AI query logged to PostgreSQL')
    } catch (error) {
      console.error('❌ Error recording AI query to PostgreSQL:', error)
    }
  }

  // ============================
  // RESPONSE PARSING & ANALYSIS
  // ============================

  private async parseAIResponse(response: string): Promise<EnhancedAIResponse> {
    return {
      response: response.trim(),
      confidence: this.calculateConfidence(response),
      sources: this.extractSources(response),
      suggested_actions: this.extractSuggestedActions(response),
      follow_up_questions: this.extractFollowUpQuestions(response)
    }
  }

  private calculateConfidence(response: string): number {
    // Simple confidence calculation based on response characteristics
    let confidence = 0.8 // Base confidence
    
    // Increase confidence for specific data references
    if (response.includes('₹') || response.includes('quotation')) confidence += 0.1
    if (response.includes('client') || response.includes('project')) confidence += 0.05
    
    // Decrease confidence for uncertain language
    if (response.includes('might') || response.includes('possibly')) confidence -= 0.2
    if (response.includes('I think') || response.includes('I believe')) confidence -= 0.3
    
    return Math.max(0.0, Math.min(1.0, confidence))
  }

  private extractSources(response: string): string[] {
    const sources: string[] = []
    
    // Look for mentions of data sources
    if (response.includes('quotation') || response.includes('project')) {
      sources.push('quotations_database')
    }
    if (response.includes('client') || response.includes('customer')) {
      sources.push('client_database')
    }
    if (response.includes('team') || response.includes('employee')) {
      sources.push('employee_database')
    }
    
    return sources
  }

  private extractSuggestedActions(response: string): string[] {
    const actions: string[] = []
    
    // Extract action-oriented language
    const actionPatterns = [
      /should (follow up|contact|send|create)/gi,
      /recommend (calling|emailing|meeting)/gi,
      /next step is to/gi
    ]
    
    for (const pattern of actionPatterns) {
      const matches = response.match(pattern)
      if (matches) {
        actions.push(...matches.map(match => match.toLowerCase()))
      }
    }
    
    return [...new Set(actions)] // Remove duplicates
  }

  private extractFollowUpQuestions(response: string): string[] {
    const questions: string[] = []
    
    // Common follow-up question patterns
    const followUpPrompts = [
      "Would you like me to check on specific clients?",
      "Should I analyze the conversion rates for this period?",
      "Do you need more details about any particular project?",
      "Would you like to see the team performance breakdown?"
    ]
    
    // Add contextual follow-ups based on response content
    if (response.includes('quotation') || response.includes('revenue')) {
      questions.push("Would you like to see the detailed quotation breakdown?")
    }
    if (response.includes('client') || response.includes('lead')) {
      questions.push("Should I analyze client engagement patterns?")
    }
    if (response.includes('team') || response.includes('employee')) {
      questions.push("Do you want to review team performance metrics?")
    }
    
    return questions.slice(0, 3) // Limit to 3 follow-up questions
  }

  // ============================
  // INTENT & ENTITY EXTRACTION
  // ============================

  private async extractIntent(query: string): Promise<string> {
    const queryLower = query.toLowerCase()
    
    // Business intelligence intents
    if (queryLower.includes('revenue') || queryLower.includes('sales') || queryLower.includes('money')) {
      return 'financial_inquiry'
    }
    if (queryLower.includes('client') || queryLower.includes('customer')) {
      return 'client_inquiry'
    }
    if (queryLower.includes('team') || queryLower.includes('employee') || queryLower.includes('staff')) {
      return 'team_inquiry'
    }
    if (queryLower.includes('project') || queryLower.includes('quotation') || queryLower.includes('order')) {
      return 'project_inquiry'
    }
    if (queryLower.includes('performance') || queryLower.includes('analytics') || queryLower.includes('report')) {
      return 'analytics_inquiry'
    }
    
    return 'general_inquiry'
  }

  private async extractEntities(query: string): Promise<Record<string, any>> {
    const entities: Record<string, any> = {}
    
    // Extract time periods
    const timePatterns = {
      today: /today|this day/gi,
      week: /this week|past week|weekly/gi,
      month: /this month|past month|monthly/gi,
      quarter: /quarter|quarterly/gi,
      year: /year|yearly|annual/gi
    }
    
    for (const [period, pattern] of Object.entries(timePatterns)) {
      if (pattern.test(query)) {
        entities.time_period = period
        break
      }
    }
    
    // Extract monetary amounts
    const moneyMatch = query.match(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g)
    if (moneyMatch) {
      entities.monetary_amounts = moneyMatch
    }
    
    // Extract client names (simple pattern)
    const clientMatch = query.match(/client\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi)
    if (clientMatch) {
      entities.mentioned_clients = clientMatch
    }
    
    return entities
  }

  // ============================
  // MESSAGE PROCESSING - POSTGRESQL
  // ============================

  async processIncomingMessage(
    channel: 'whatsapp' | 'instagram' | 'email' | 'call',
    message: {
      from: string
      to: string
      content: string
      timestamp: string
      messageId?: string
    }
  ): Promise<{
    recorded: boolean
    ai_insights?: string
    suggested_response?: string
    priority_level: 'low' | 'medium' | 'high' | 'urgent'
  }> {
    try {
      console.log(`📱 Processing incoming ${channel} message via PostgreSQL`)
      
      // Check if entity exists in PostgreSQL
      const entityResult = await query(`
        SELECT id, name, entity_type, metadata 
        FROM business_entities 
        WHERE (primary_phone = $1 OR email = $1 OR whatsapp_number = $1)
          AND entity_type IN ('client', 'lead', 'prospect')
        LIMIT 1
      `, [message.from])

      let entity = entityResult.rows[0] || null

      // Create new entity if not found
      if (!entity) {
        const createResult = await query(`
          INSERT INTO business_entities (
            name, 
            entity_type, 
            primary_phone, 
            entity_status,
            created_at
          ) VALUES ($1, 'prospect', $2, 'active', NOW())
          RETURNING *
        `, [message.from, message.from])
        
        entity = createResult.rows[0]
        console.log('✅ New prospect entity created in PostgreSQL')
      }

      // Record communication in PostgreSQL
      await query(`
        INSERT INTO communications (
          entity_id,
          channel_type,
          direction,
          sender_id,
          recipient_id,
          content_text,
          sent_at,
          message_id,
          created_at
        ) VALUES ($1, $2, 'inbound', $3, $4, $5, $6, $7, NOW())
      `, [
        entity.id,
        channel,
        message.from,
        message.to,
        message.content,
        message.timestamp,
        message.messageId
      ])

      // Analyze message content
      const analysis = await this.analyzeMessageContent(message.content, entity)

      // Generate suggested response
      const suggestedResponse = await this.generateSuggestedResponse(
        message.content,
        entity,
        channel
      )

      console.log(`✅ ${channel} message processed and stored in PostgreSQL`)

      return {
        recorded: true,
        ai_insights: analysis.insights,
        suggested_response: suggestedResponse,
        priority_level: analysis.priority
      }

    } catch (error) {
      console.error(`❌ Error processing ${channel} message:`, error)
      return {
        recorded: false,
        priority_level: 'medium'
      }
    }
  }

  private async analyzeMessageContent(
    content: string,
    entity: BusinessEntity
  ): Promise<{
    insights: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }> {
    const contentLower = content.toLowerCase()
    
    // Determine priority based on content
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low'
    
    if (contentLower.includes('urgent') || contentLower.includes('asap') || contentLower.includes('emergency')) {
      priority = 'urgent'
    } else if (contentLower.includes('quotation') || contentLower.includes('price') || contentLower.includes('booking')) {
      priority = 'high'
    } else if (contentLower.includes('inquiry') || contentLower.includes('question') || contentLower.includes('interested')) {
      priority = 'medium'
    }

    const insights = `Message analysis: ${priority} priority. Content indicates ${
      contentLower.includes('quotation') ? 'quotation request' :
      contentLower.includes('booking') ? 'booking inquiry' :
      contentLower.includes('price') ? 'pricing inquiry' :
      'general communication'
    }.`

    return { insights, priority }
  }

  private async generateSuggestedResponse(
    originalMessage: string,
    entity: BusinessEntity,
    channel: string
  ): Promise<string> {
    const messageLower = originalMessage.toLowerCase()
    
    // Basic template responses based on content
    if (messageLower.includes('quotation') || messageLower.includes('price')) {
      return `Hello! Thank you for your interest in our photography services. I'd be happy to provide you with a detailed quotation. Could you please share more details about your event date, location, and specific requirements?`
    }
    
    if (messageLower.includes('booking') || messageLower.includes('book')) {
      return `Hi! Thank you for considering us for your photography needs. To help us provide the best service, could you please share your event details including the date, venue, and type of photography service you need?`
    }
    
    if (messageLower.includes('available') || messageLower.includes('availability')) {
      return `Hello! Thank you for reaching out. To check our availability, could you please let me know your preferred event date and location? I'll be happy to confirm our availability for you.`
    }
    
    // Default response
    return `Hello! Thank you for contacting us. We appreciate your interest in our photography and videography services. How can we assist you today?`
  }

  // ============================
  // UTILITY METHODS
  // ============================

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }

  async getSystemHealth(): Promise<{
    ai_status: 'healthy' | 'degraded' | 'offline'
    llm_connection: boolean
    data_sync_status: any
    recent_activity: any
  }> {
    try {
      // Test LLM connection
      const llmConnection = await this.llmService.testConnection()
      
      // Test PostgreSQL connection
      const dbTest = await query('SELECT NOW() as current_time')
      const dbConnection = dbTest.rows.length > 0
      
      // Get recent activity from PostgreSQL
      const activityResult = await query(`
        SELECT COUNT(*) as total_queries
        FROM ai_query_logs 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `)
      
      const recentActivity = {
        queries_last_hour: parseInt(activityResult.rows[0]?.total_queries || '0')
      }

      const ai_status: 'healthy' | 'degraded' | 'offline' = 
        llmConnection && dbConnection ? 'healthy' :
        llmConnection || dbConnection ? 'degraded' : 'offline'

      return {
        ai_status,
        llm_connection,
        data_sync_status: { postgresql: dbConnection },
        recent_activity: recentActivity
      }
    } catch (error) {
      console.error('❌ Error checking AI system health:', error)
      return {
        ai_status: 'offline',
        llm_connection: false,
        data_sync_status: { postgresql: false },
        recent_activity: { queries_last_hour: 0 }
      }
    }
  }
}

// Export singleton instance
export const enhancedAIService = new EnhancedAIService() 