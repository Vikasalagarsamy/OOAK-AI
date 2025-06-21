import { query, transaction } from '@/lib/postgresql-client'
import { v4 as uuidv4 } from 'uuid'

// Type definitions for the universal business intelligence system
export interface Communication {
  id: string
  channel_type: 'whatsapp' | 'instagram' | 'email' | 'call' | 'sms' | 'internal'
  message_id?: string
  thread_id?: string
  sender_type: 'client' | 'employee' | 'vendor' | 'system'
  sender_id?: string
  sender_name?: string
  recipient_type: 'client' | 'employee' | 'vendor' | 'system'
  recipient_id?: string
  recipient_name?: string
  content_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice_note'
  content_text?: string
  content_metadata?: Record<string, any>
  business_context?: string
  related_lead_id?: number
  related_quotation_id?: number
  related_project_id?: number
  ai_processed: boolean
  ai_intent?: string
  ai_sentiment?: 'positive' | 'neutral' | 'negative'
  ai_keywords?: string[]
  ai_entities?: Record<string, any>
  ai_priority_score: number
  sent_at: string
  delivered_at?: string
  read_at?: string
  created_at: string
  updated_at: string
}

export interface BusinessEntity {
  id: string
  entity_type: 'client' | 'employee' | 'vendor' | 'partner'
  entity_status: 'active' | 'inactive' | 'blocked'
  name: string
  display_name?: string
  primary_phone?: string
  whatsapp_number?: string
  instagram_handle?: string
  email?: string
  alternate_contacts?: Array<Record<string, any>>
  company_name?: string
  designation?: string
  address?: Record<string, any>
  relationship_manager_id?: string
  acquisition_source?: string
  communication_preferences?: Record<string, any>
  interaction_history_summary?: string
  ai_personality_profile?: Record<string, any>
  custom_fields?: Record<string, any>
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface KnowledgeItem {
  id: string
  content_type: string
  source_type: string
  source_id?: string
  title?: string
  content: string
  summary?: string
  business_area?: string
  relevance_tags?: string[]
  entity_mentions?: string[]
  content_embedding?: number[]
  ai_keywords?: string[]
  ai_categories?: string[]
  importance_score: number
  visibility: 'public' | 'internal' | 'confidential'
  access_groups?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AIContextSession {
  id: string
  session_name?: string
  user_id: string
  active_contexts?: Array<Record<string, any>>
  context_history?: Array<Record<string, any>>
  current_intent?: string
  context_memory?: Record<string, any>
  conversation_summary?: string
  session_status: 'active' | 'paused' | 'ended'
  started_at: string
  last_interaction_at: string
  ended_at?: string
  created_at: string
  updated_at: string
}

export interface AIQueryRecord {
  id: string
  session_id?: string
  user_query: string
  query_intent?: string
  query_entities?: Record<string, any>
  context_sources?: Array<Record<string, any>>
  retrieved_communications: number
  retrieved_knowledge_items: number
  ai_response: string
  response_confidence?: number
  response_sources?: string[]
  processing_time_ms?: number
  tokens_used?: number
  created_at: string
}

export class UniversalBusinessIntelligenceService {
  // ============================
  // COMMUNICATION MANAGEMENT
  // ============================

  async recordCommunication(communication: Omit<Communication, 'id' | 'created_at' | 'updated_at'>): Promise<Communication> {
    console.log('🎯 Recording new communication:', communication.channel_type, communication.sender_type)
    
    try {
      const communicationId = uuidv4()
      const now = new Date().toISOString()
      
      const result = await query(`
        INSERT INTO communications (
          id, channel_type, message_id, thread_id, sender_type, sender_id, sender_name,
          recipient_type, recipient_id, recipient_name, content_type, content_text,
          content_metadata, business_context, related_lead_id, related_quotation_id,
          related_project_id, ai_processed, ai_intent, ai_sentiment, ai_keywords,
          ai_entities, ai_priority_score, sent_at, delivered_at, read_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $27
        ) RETURNING *
      `, [
        communicationId, communication.channel_type, communication.message_id, communication.thread_id,
        communication.sender_type, communication.sender_id, communication.sender_name,
        communication.recipient_type, communication.recipient_id, communication.recipient_name,
        communication.content_type, communication.content_text, JSON.stringify(communication.content_metadata),
        communication.business_context, communication.related_lead_id, communication.related_quotation_id,
        communication.related_project_id, communication.ai_processed, communication.ai_intent,
        communication.ai_sentiment, JSON.stringify(communication.ai_keywords), JSON.stringify(communication.ai_entities),
        communication.ai_priority_score, communication.sent_at, communication.delivered_at,
        communication.read_at, now
      ])

      const data = result.rows[0]
      console.log('✅ Communication recorded:', data.id)
      
      // Queue for AI processing
      await this.queueForProcessing('ai_process_communication', 'communications', data.id, {
        channel_type: communication.channel_type,
        content_text: communication.content_text
      })

      return {
        ...data,
        content_metadata: data.content_metadata ? JSON.parse(data.content_metadata) : null,
        ai_keywords: data.ai_keywords ? JSON.parse(data.ai_keywords) : null,
        ai_entities: data.ai_entities ? JSON.parse(data.ai_entities) : null
      }
    } catch (error) {
      console.error('❌ Error recording communication:', error)
      throw error
    }
  }

  async getRecentCommunications(
    filters: {
      channel_type?: string
      sender_id?: string
      business_context?: string
      limit?: number
    } = {}
  ): Promise<Communication[]> {
    console.log('📞 Fetching recent communications with filters:', filters)

    try {
      const whereConditions = []
      const params = []
      let paramCount = 0

      if (filters.channel_type) {
        whereConditions.push(`channel_type = $${++paramCount}`)
        params.push(filters.channel_type)
      }

      if (filters.sender_id) {
        whereConditions.push(`sender_id = $${++paramCount}`)
        params.push(filters.sender_id)
      }

      if (filters.business_context) {
        whereConditions.push(`business_context = $${++paramCount}`)
        params.push(filters.business_context)
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
      const limit = filters.limit || 50

      const result = await query(`
        SELECT * FROM communications
        ${whereClause}
        ORDER BY sent_at DESC
        LIMIT $${++paramCount}
      `, [...params, limit])

      const communications = result.rows.map(row => ({
        ...row,
        content_metadata: row.content_metadata ? JSON.parse(row.content_metadata) : null,
        ai_keywords: row.ai_keywords ? JSON.parse(row.ai_keywords) : null,
        ai_entities: row.ai_entities ? JSON.parse(row.ai_entities) : null
      }))

      console.log(`✅ Retrieved ${communications.length} communications`)
      return communications
    } catch (error) {
      console.error('❌ Error fetching communications:', error)
      throw error
    }
  }

  async getCommunicationContext(
    entityId: string,
    contextType: string = 'all'
  ): Promise<{
    communications: Communication[]
    summary: string
    key_insights: string[]
  }> {
    console.log('🧠 Getting communication context for:', entityId, contextType)

    try {
      // Get recent communications for this entity
      const communications = await this.getRecentCommunications({
        sender_id: entityId,
        limit: 20
      })

      // Generate AI summary and insights
      const summary = await this.generateCommunicationSummary(communications)
      const key_insights = await this.extractKeyInsights(communications)

      return {
        communications,
        summary,
        key_insights
      }
    } catch (error) {
      console.error('❌ Error getting communication context:', error)
      throw error
    }
  }

  // ============================
  // BUSINESS ENTITY MANAGEMENT
  // ============================

  async createOrUpdateEntity(entityData: Omit<BusinessEntity, 'id' | 'created_at' | 'updated_at'>): Promise<BusinessEntity> {
    console.log('👤 Creating/updating business entity:', entityData.name, entityData.entity_type)

    try {
      // Check if entity exists by phone, email, or whatsapp
      const existingResult = await query(`
        SELECT id FROM business_entities 
        WHERE primary_phone = $1 OR email = $2 OR whatsapp_number = $3
        LIMIT 1
      `, [entityData.primary_phone, entityData.email, entityData.whatsapp_number])

      const now = new Date().toISOString()

      if (existingResult.rows.length > 0) {
        // Update existing entity
        const entityId = existingResult.rows[0].id
        const result = await query(`
          UPDATE business_entities SET
            entity_type = $1, entity_status = $2, name = $3, display_name = $4,
            primary_phone = $5, whatsapp_number = $6, instagram_handle = $7, email = $8,
            alternate_contacts = $9, company_name = $10, designation = $11, address = $12,
            relationship_manager_id = $13, acquisition_source = $14, communication_preferences = $15,
            interaction_history_summary = $16, ai_personality_profile = $17, custom_fields = $18,
            tags = $19, updated_at = $20
          WHERE id = $21
          RETURNING *
        `, [
          entityData.entity_type, entityData.entity_status, entityData.name, entityData.display_name,
          entityData.primary_phone, entityData.whatsapp_number, entityData.instagram_handle, entityData.email,
          JSON.stringify(entityData.alternate_contacts), entityData.company_name, entityData.designation,
          JSON.stringify(entityData.address), entityData.relationship_manager_id, entityData.acquisition_source,
          JSON.stringify(entityData.communication_preferences), entityData.interaction_history_summary,
          JSON.stringify(entityData.ai_personality_profile), JSON.stringify(entityData.custom_fields),
          JSON.stringify(entityData.tags), now, entityId
        ])

        const data = result.rows[0]
        console.log('✅ Entity updated:', data.id)
        return this.parseEntityData(data)
      } else {
        // Create new entity
        const entityId = uuidv4()
        const result = await query(`
          INSERT INTO business_entities (
            id, entity_type, entity_status, name, display_name, primary_phone, whatsapp_number,
            instagram_handle, email, alternate_contacts, company_name, designation, address,
            relationship_manager_id, acquisition_source, communication_preferences,
            interaction_history_summary, ai_personality_profile, custom_fields, tags,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21
          ) RETURNING *
        `, [
          entityId, entityData.entity_type, entityData.entity_status, entityData.name, entityData.display_name,
          entityData.primary_phone, entityData.whatsapp_number, entityData.instagram_handle, entityData.email,
          JSON.stringify(entityData.alternate_contacts), entityData.company_name, entityData.designation,
          JSON.stringify(entityData.address), entityData.relationship_manager_id, entityData.acquisition_source,
          JSON.stringify(entityData.communication_preferences), entityData.interaction_history_summary,
          JSON.stringify(entityData.ai_personality_profile), JSON.stringify(entityData.custom_fields),
          JSON.stringify(entityData.tags), now
        ])

        const data = result.rows[0]
        console.log('✅ Entity created:', data.id)
        return this.parseEntityData(data)
      }
    } catch (error) {
      console.error('❌ Error creating/updating entity:', error)
      throw error
    }
  }

  async getEntityByContact(contact: string): Promise<BusinessEntity | null> {
    try {
      const result = await query(`
        SELECT * FROM business_entities 
        WHERE primary_phone = $1 OR email = $1 OR whatsapp_number = $1 OR instagram_handle = $1
        LIMIT 1
      `, [contact])

      if (result.rows.length === 0) {
        return null
      }

      return this.parseEntityData(result.rows[0])
    } catch (error) {
      console.error('❌ Error fetching entity by contact:', error)
      return null
    }
  }

  async getAllEntities(entityType?: string): Promise<BusinessEntity[]> {
    try {
      let queryText = `
        SELECT * FROM business_entities 
        WHERE entity_status = 'active'
      `
      const params = []

      if (entityType) {
        queryText += ` AND entity_type = $1`
        params.push(entityType)
      }

      queryText += ` ORDER BY name`

      const result = await query(queryText, params)
      return result.rows.map(row => this.parseEntityData(row))
    } catch (error) {
      console.error('❌ Error fetching entities:', error)
      throw error
    }
  }

  // ============================
  // KNOWLEDGE BASE MANAGEMENT
  // ============================

  async addToKnowledgeBase(knowledgeData: Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>): Promise<KnowledgeItem> {
    console.log('📚 Adding to knowledge base:', knowledgeData.title, knowledgeData.content_type)

    try {
      const knowledgeId = uuidv4()
      const now = new Date().toISOString()

      const result = await query(`
        INSERT INTO knowledge_base (
          id, content_type, source_type, source_id, title, content, summary, business_area,
          relevance_tags, entity_mentions, content_embedding, ai_keywords, ai_categories,
          importance_score, visibility, access_groups, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18
        ) RETURNING *
      `, [
        knowledgeId, knowledgeData.content_type, knowledgeData.source_type, knowledgeData.source_id,
        knowledgeData.title, knowledgeData.content, knowledgeData.summary, knowledgeData.business_area,
        JSON.stringify(knowledgeData.relevance_tags), JSON.stringify(knowledgeData.entity_mentions),
        JSON.stringify(knowledgeData.content_embedding), JSON.stringify(knowledgeData.ai_keywords),
        JSON.stringify(knowledgeData.ai_categories), knowledgeData.importance_score, knowledgeData.visibility,
        JSON.stringify(knowledgeData.access_groups), JSON.stringify(knowledgeData.metadata), now
      ])

      const data = result.rows[0]
      console.log('✅ Knowledge item added:', data.id)

      // Queue for embedding generation
      await this.queueForProcessing('generate_embeddings', 'knowledge_base', data.id, {
        content: knowledgeData.content,
        title: knowledgeData.title
      })

      return this.parseKnowledgeData(data)
    } catch (error) {
      console.error('❌ Error adding to knowledge base:', error)
      throw error
    }
  }

  async searchKnowledgeBase(
    searchQuery: string,
    filters: {
      content_type?: string
      business_area?: string
      limit?: number
    } = {}
  ): Promise<KnowledgeItem[]> {
    console.log('🔍 Searching knowledge base:', searchQuery)

    try {
      const whereConditions = []
      const params = []
      let paramCount = 0

      // Text search
      if (searchQuery.trim()) {
        whereConditions.push(`(
          content ILIKE $${++paramCount} OR 
          title ILIKE $${++paramCount} OR 
          ai_keywords::text ILIKE $${++paramCount}
        )`)
        const searchPattern = `%${searchQuery}%`
        params.push(searchPattern, searchPattern, searchPattern)
      }

      if (filters.content_type) {
        whereConditions.push(`content_type = $${++paramCount}`)
        params.push(filters.content_type)
      }

      if (filters.business_area) {
        whereConditions.push(`business_area = $${++paramCount}`)
        params.push(filters.business_area)
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
      const limit = filters.limit || 10

      const result = await query(`
        SELECT * FROM knowledge_base
        ${whereClause}
        ORDER BY importance_score DESC
        LIMIT $${++paramCount}
      `, [...params, limit])

      const knowledgeItems = result.rows.map(row => this.parseKnowledgeData(row))
      console.log(`✅ Found ${knowledgeItems.length} knowledge items`)
      return knowledgeItems
    } catch (error) {
      console.error('❌ Error searching knowledge base:', error)
      throw error
    }
  }

  // ============================
  // AI CONTEXT MANAGEMENT
  // ============================

  async createAISession(userId: string, sessionName?: string): Promise<AIContextSession> {
    console.log('🧠 Creating new AI context session for user:', userId)

    try {
      const sessionId = uuidv4()
      const now = new Date().toISOString()

      const result = await query(`
        INSERT INTO ai_context_sessions (
          id, user_id, session_name, session_status, active_contexts, context_history,
          context_memory, started_at, last_interaction_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'active', $4, $5, $6, $7, $7, $7, $7
        ) RETURNING *
      `, [
        sessionId, userId, sessionName || `Session ${new Date().toLocaleString()}`,
        JSON.stringify([]), JSON.stringify([]), JSON.stringify({}), now
      ])

      const data = result.rows[0]
      console.log('✅ AI session created:', data.id)
      return this.parseSessionData(data)
    } catch (error) {
      console.error('❌ Error creating AI session:', error)
      throw error
    }
  }

  async recordAIQuery(queryData: Omit<AIQueryRecord, 'id' | 'created_at'>): Promise<AIQueryRecord> {
    try {
      const queryId = uuidv4()
      const now = new Date().toISOString()

      const result = await query(`
        INSERT INTO ai_query_history (
          id, session_id, user_query, query_intent, query_entities, context_sources,
          retrieved_communications, retrieved_knowledge_items, ai_response, response_confidence,
          response_sources, processing_time_ms, tokens_used, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *
      `, [
        queryId, queryData.session_id, queryData.user_query, queryData.query_intent,
        JSON.stringify(queryData.query_entities), JSON.stringify(queryData.context_sources),
        queryData.retrieved_communications, queryData.retrieved_knowledge_items, queryData.ai_response,
        queryData.response_confidence, JSON.stringify(queryData.response_sources),
        queryData.processing_time_ms, queryData.tokens_used, now
      ])

      return this.parseQueryData(result.rows[0])
    } catch (error) {
      console.error('❌ Error recording AI query:', error)
      throw error
    }
  }

  async getAIContextForUser(userId: string): Promise<{
    recent_queries: AIQueryRecord[]
    active_session?: AIContextSession
    relevant_communications: Communication[]
    key_knowledge: KnowledgeItem[]
  }> {
    console.log('🎯 Getting AI context for user:', userId)

    try {
      // Get active session
      const sessionResult = await query(`
        SELECT * FROM ai_context_sessions 
        WHERE user_id = $1 AND session_status = 'active'
        ORDER BY last_interaction_at DESC
        LIMIT 1
      `, [userId])

      const activeSession = sessionResult.rows.length > 0 ? this.parseSessionData(sessionResult.rows[0]) : undefined

      // Get recent queries
      const queriesResult = await query(`
        SELECT * FROM ai_query_history 
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `, [activeSession?.id || ''])

      const recentQueries = queriesResult.rows.map(row => this.parseQueryData(row))

      // Get recent communications
      const relevantCommunications = await this.getRecentCommunications({ limit: 20 })

      // Get important knowledge items
      const keyKnowledge = await this.searchKnowledgeBase('', { limit: 10 })

      return {
        recent_queries: recentQueries,
        active_session: activeSession,
        relevant_communications: relevantCommunications,
        key_knowledge: keyKnowledge
      }
    } catch (error) {
      console.error('❌ Error getting AI context:', error)
      throw error
    }
  }

  // ============================
  // SMART CONTEXT RETRIEVAL
  // ============================

  async getSmartContextForQuery(
    searchQuery: string,
    userId: string,
    maxItems: number = 10
  ): Promise<{
    relevant_communications: Communication[]
    relevant_knowledge: KnowledgeItem[]
    relevant_entities: BusinessEntity[]
    context_summary: string
  }> {
    console.log('🧠 Getting smart context for query:', searchQuery)

    try {
      // Extract entities and intent from query (simplified)
      const queryKeywords = searchQuery.toLowerCase().split(' ').filter(word => word.length > 3)
      
      // Search communications
      const relevant_communications = await this.getRecentCommunications({
        limit: Math.floor(maxItems * 0.4)
      })

      // Search knowledge base
      const relevant_knowledge = await this.searchKnowledgeBase(searchQuery, {
        limit: Math.floor(maxItems * 0.4)
      })

      // Get relevant entities (simplified - could be smarter)
      const relevant_entities = await this.getAllEntities()

      const context_summary = `Found ${relevant_communications.length} recent communications, ${relevant_knowledge.length} knowledge items, and ${relevant_entities.length} business entities for context.`

      return {
        relevant_communications,
        relevant_knowledge,
        relevant_entities,
        context_summary
      }
    } catch (error) {
      console.error('❌ Error getting smart context:', error)
      throw error
    }
  }

  // ============================
  // DATA PROCESSING QUEUE
  // ============================

  async queueForProcessing(
    taskType: string,
    sourceTable: string,
    sourceId: string,
    taskData: Record<string, any>,
    priority: number = 5
  ): Promise<void> {
    try {
      await query(`
        INSERT INTO data_processing_queue (
          task_type, priority, source_table, source_id, task_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [taskType, priority, sourceTable, sourceId, JSON.stringify(taskData), new Date().toISOString()])

      console.log('✅ Queued for processing:', taskType, sourceId)
    } catch (error) {
      console.error('❌ Error queuing for processing:', error)
    }
  }

  // ============================
  // HELPER METHODS
  // ============================

  private async generateCommunicationSummary(communications: Communication[]): Promise<string> {
    if (communications.length === 0) return 'No communications found.'
    
    const totalMessages = communications.length
    const channels = new Set(communications.map(c => c.channel_type)).size
    const recentDate = communications[0]?.sent_at
    
    return `${totalMessages} messages across ${channels} channels. Most recent: ${new Date(recentDate).toLocaleDateString()}`
  }

  private async extractKeyInsights(communications: Communication[]): Promise<string[]> {
    const insights: string[] = []
    
    // Basic insights (can be enhanced with AI)
    const intents = communications.filter(c => c.ai_intent).map(c => c.ai_intent)
    const sentiments = communications.filter(c => c.ai_sentiment).map(c => c.ai_sentiment)
    
    if (intents.length > 0) {
      const topIntent = intents.reduce((a, b, i, arr) => 
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      )
      insights.push(`Most common intent: ${topIntent}`)
    }

    if (sentiments.length > 0) {
      const positiveSentiments = sentiments.filter(s => s === 'positive').length
      const totalSentiments = sentiments.length
      const positivityRate = (positiveSentiments / totalSentiments * 100).toFixed(1)
      insights.push(`${positivityRate}% positive sentiment`)
    }

    return insights
  }

  // ============================
  // PLATFORM INTEGRATION HELPERS
  // ============================

  async recordWhatsAppMessage(
    message: {
      messageId: string
      from: string
      to: string
      text: string
      timestamp: string
      isFromClient: boolean
    }
  ): Promise<Communication> {
    return this.recordCommunication({
      channel_type: 'whatsapp',
      message_id: message.messageId,
      sender_type: message.isFromClient ? 'client' : 'employee',
      sender_id: message.from,
      recipient_type: message.isFromClient ? 'employee' : 'client',
      recipient_id: message.to,
      content_type: 'text',
      content_text: message.text,
      sent_at: message.timestamp,
      ai_processed: false,
      ai_priority_score: 0.5
    })
  }

  async recordInstagramMessage(
    message: {
      messageId: string
      from: string
      to: string
      text: string
      timestamp: string
      isFromClient: boolean
    }
  ): Promise<Communication> {
    return this.recordCommunication({
      channel_type: 'instagram',
      message_id: message.messageId,
      sender_type: message.isFromClient ? 'client' : 'employee',
      sender_id: message.from,
      recipient_type: message.isFromClient ? 'employee' : 'client',
      recipient_id: message.to,
      content_type: 'text',
      content_text: message.text,
      sent_at: message.timestamp,
      ai_processed: false,
      ai_priority_score: 0.5
    })
  }

  async recordEmailMessage(
    email: {
      messageId: string
      from: string
      to: string
      subject: string
      body: string
      timestamp: string
      isFromClient: boolean
    }
  ): Promise<Communication> {
    return this.recordCommunication({
      channel_type: 'email',
      message_id: email.messageId,
      sender_type: email.isFromClient ? 'client' : 'employee',
      sender_id: email.from,
      recipient_type: email.isFromClient ? 'employee' : 'client',
      recipient_id: email.to,
      content_type: 'text',
      content_text: `Subject: ${email.subject}\n\n${email.body}`,
      sent_at: email.timestamp,
      ai_processed: false,
      ai_priority_score: 0.6
    })
  }

  async recordCallTranscript(
    call: {
      callId: string
      from: string
      to: string
      transcript: string
      duration: number
      timestamp: string
      isFromClient: boolean
    }
  ): Promise<Communication> {
    return this.recordCommunication({
      channel_type: 'call',
      message_id: call.callId,
      sender_type: call.isFromClient ? 'client' : 'employee',
      sender_id: call.from,
      recipient_type: call.isFromClient ? 'employee' : 'client',
      recipient_id: call.to,
      content_type: 'audio',
      content_text: call.transcript,
      content_metadata: { duration: call.duration },
      sent_at: call.timestamp,
      ai_processed: false,
      ai_priority_score: 0.8 // Calls are typically higher priority
    })
  }

  // ============================
  // SYSTEM HEALTH & STATUS
  // ============================

  async getSystemStatus(): Promise<{
    total_communications: number
    total_entities: number
    total_knowledge_items: number
    recent_activity: string
    sync_status: Record<string, any>
  }> {
    console.log('📊 Getting system status')

    try {
      // Get counts using PostgreSQL
      const [commResult, entitiesResult, knowledgeResult, syncResult] = await Promise.all([
        query('SELECT COUNT(*) as count FROM communications'),
        query('SELECT COUNT(*) as count FROM business_entities'),
        query('SELECT COUNT(*) as count FROM knowledge_base'),
        query('SELECT * FROM data_sync_status')
      ])

      const recentActivity = `Last updated: ${new Date().toLocaleString()}`

      return {
        total_communications: parseInt(commResult.rows[0]?.count || '0'),
        total_entities: parseInt(entitiesResult.rows[0]?.count || '0'),
        total_knowledge_items: parseInt(knowledgeResult.rows[0]?.count || '0'),
        recent_activity: recentActivity,
        sync_status: syncResult.rows.reduce((acc, row) => {
          acc[row.sync_type] = row
          return acc
        }, {})
      }
    } catch (error) {
      console.error('❌ Error getting system status:', error)
      throw error
    }
  }

  // ============================
  // DATA PARSING HELPERS
  // ============================

  private parseEntityData(row: any): BusinessEntity {
    return {
      ...row,
      alternate_contacts: row.alternate_contacts ? JSON.parse(row.alternate_contacts) : [],
      address: row.address ? JSON.parse(row.address) : null,
      communication_preferences: row.communication_preferences ? JSON.parse(row.communication_preferences) : null,
      ai_personality_profile: row.ai_personality_profile ? JSON.parse(row.ai_personality_profile) : null,
      custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null,
      tags: row.tags ? JSON.parse(row.tags) : []
    }
  }

  private parseKnowledgeData(row: any): KnowledgeItem {
    return {
      ...row,
      relevance_tags: row.relevance_tags ? JSON.parse(row.relevance_tags) : [],
      entity_mentions: row.entity_mentions ? JSON.parse(row.entity_mentions) : [],
      content_embedding: row.content_embedding ? JSON.parse(row.content_embedding) : [],
      ai_keywords: row.ai_keywords ? JSON.parse(row.ai_keywords) : [],
      ai_categories: row.ai_categories ? JSON.parse(row.ai_categories) : [],
      access_groups: row.access_groups ? JSON.parse(row.access_groups) : [],
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    }
  }

  private parseSessionData(row: any): AIContextSession {
    return {
      ...row,
      active_contexts: row.active_contexts ? JSON.parse(row.active_contexts) : [],
      context_history: row.context_history ? JSON.parse(row.context_history) : [],
      context_memory: row.context_memory ? JSON.parse(row.context_memory) : {}
    }
  }

  private parseQueryData(row: any): AIQueryRecord {
    return {
      ...row,
      query_entities: row.query_entities ? JSON.parse(row.query_entities) : null,
      context_sources: row.context_sources ? JSON.parse(row.context_sources) : [],
      response_sources: row.response_sources ? JSON.parse(row.response_sources) : []
    }
  }
}

// Export singleton instance
export const businessIntelligenceService = new UniversalBusinessIntelligenceService() 