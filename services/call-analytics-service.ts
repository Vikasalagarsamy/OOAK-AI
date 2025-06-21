// 🎯 MIGRATED: Call Analytics Service - PostgreSQL Version
// Original: services/call-analytics-service.ts (Supabase)
// Migrated: Direct PostgreSQL queries for advanced call analytics

import { query, transaction } from "@/lib/postgresql-client"
import { UniversalBusinessIntelligenceService } from './universal-business-intelligence-service'

const universalBI = new UniversalBusinessIntelligenceService()

// ==========================
// CALL ANALYTICS INTERFACES
// ==========================

export interface CallTranscription {
  id: string
  call_id: string
  task_id?: string
  lead_id?: number
  client_name: string
  sales_agent: string
  phone_number: string
  duration: number
  recording_url?: string
  transcript: string
  confidence_score: number
  language: string
  created_at: string
}

export interface CallAnalytics {
  id: string
  call_id: string
  
  // Sentiment Analysis
  overall_sentiment: 'positive' | 'negative' | 'neutral'
  sentiment_score: number // -1.0 to 1.0
  client_sentiment: 'positive' | 'negative' | 'neutral'
  agent_sentiment: 'positive' | 'negative' | 'neutral'
  
  // Call Intent & Topics
  call_intent: string
  key_topics: string[]
  business_outcomes: string[]
  action_items: string[]
  
  // Behavioral Analysis
  agent_performance: {
    professionalism_score: number
    responsiveness_score: number
    knowledge_score: number
    closing_effectiveness: number
  }
  
  client_behavior: {
    engagement_level: 'high' | 'medium' | 'low'
    interest_level: 'high' | 'medium' | 'low'
    objection_handling: string[]
    buying_signals: string[]
  }
  
  // Forbidden Words & Compliance
  forbidden_words_detected: string[]
  compliance_issues: string[]
  risk_level: 'low' | 'medium' | 'high'
  
  // Conversation Insights
  talk_time_ratio: number // agent vs client talk time
  interruptions: number
  silent_periods: number
  call_quality_score: number
  
  // Business Intelligence
  quote_discussed: boolean
  budget_mentioned: boolean
  timeline_discussed: boolean
  next_steps_agreed: boolean
  follow_up_required: boolean
  
  created_at: string
  updated_at: string
}

export interface CallInsights {
  sales_performance: {
    conversion_indicators: string[]
    objection_patterns: string[]
    successful_techniques: string[]
    improvement_areas: string[]
  }
  
  client_insights: {
    decision_factors: string[]
    pain_points: string[]
    preferences: string[]
    concerns: string[]
  }
  
  business_intelligence: {
    market_trends: string[]
    competitive_mentions: string[]
    pricing_feedback: string[]
    service_feedback: string[]
  }
}

export class CallAnalyticsService {
  
  // ==========================
  // TRANSCRIPTION ENGINE
  // ==========================
  
  async transcribeCall(callData: {
    call_id: string
    task_id?: string
    lead_id?: number
    client_name: string
    sales_agent: string
    phone_number: string
    recording_url?: string
    audio_file?: Buffer
    duration: number
  }): Promise<CallTranscription> {
    console.log('🎙️ Starting call transcription with PostgreSQL for:', callData.call_id)
    
    try {
      let transcript = ''
      let confidence_score = 0
      
      // Use OpenAI Whisper for transcription
      if (callData.recording_url) {
        const transcriptionResult = await this.whisperTranscription(callData.recording_url)
        transcript = transcriptionResult.text
        confidence_score = transcriptionResult.confidence
      } else if (callData.audio_file) {
        const transcriptionResult = await this.whisperTranscriptionFromBuffer(callData.audio_file)
        transcript = transcriptionResult.text
        confidence_score = transcriptionResult.confidence
      } else {
        throw new Error('No audio source provided for transcription')
      }
      
      // Store transcription in PostgreSQL
      const transcriptionResult = await query(`
        INSERT INTO call_transcriptions (
          call_id,
          task_id,
          lead_id,
          client_name,
          sales_agent,
          phone_number,
          duration,
          recording_url,
          transcript,
          confidence_score,
          language,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        callData.call_id,
        callData.task_id,
        callData.lead_id,
        callData.client_name,
        callData.sales_agent,
        callData.phone_number,
        callData.duration,
        callData.recording_url,
        transcript,
        confidence_score,
        'en', // Auto-detect later
        new Date().toISOString()
      ])

      const transcriptionRecord = transcriptionResult.rows[0]
      
      console.log('✅ Call transcription completed:', transcriptionRecord.id)
      
      // Trigger analytics processing
      await this.analyzeCall(transcriptionRecord)
      
      // Update task with transcription link
      if (callData.task_id) {
        await this.updateTaskWithTranscription(callData.task_id, transcriptionRecord.id)
      }
      
      return transcriptionRecord
      
    } catch (error) {
      console.error('❌ Call transcription failed:', error)
      throw error
    }
  }
  
  private async whisperTranscription(recordingUrl: string): Promise<{text: string, confidence: number}> {
    try {
      // Download audio file
      const audioResponse = await fetch(recordingUrl)
      const audioBuffer = await audioResponse.arrayBuffer()
      
      // Convert to proper format for Whisper
      const formData = new FormData()
      formData.append('file', new Blob([audioBuffer]), 'audio.mp3')
      formData.append('model', 'whisper-1')
      formData.append('language', 'en')
      formData.append('response_format', 'verbose_json')
      
      // Call OpenAI Whisper API
      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData
      })
      
      if (!whisperResponse.ok) {
        throw new Error(`Whisper API error: ${whisperResponse.statusText}`)
      }
      
      const whisperResult = await whisperResponse.json()
      
      return {
        text: whisperResult.text,
        confidence: whisperResult.segments?.reduce((acc: number, seg: any) => acc + (seg.avg_logprob || 0), 0) / (whisperResult.segments?.length || 1) || 0.8
      }
      
    } catch (error) {
      console.error('❌ Whisper transcription failed:', error)
      throw error
    }
  }
  
  private async whisperTranscriptionFromBuffer(audioBuffer: Buffer): Promise<{text: string, confidence: number}> {
    try {
      const formData = new FormData()
      formData.append('file', new Blob([audioBuffer]), 'audio.wav')
      formData.append('model', 'whisper-1')
      formData.append('language', 'en')
      formData.append('response_format', 'verbose_json')
      
      const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData
      })
      
      if (!whisperResponse.ok) {
        throw new Error(`Whisper API error: ${whisperResponse.statusText}`)
      }
      
      const whisperResult = await whisperResponse.json()
      
      return {
        text: whisperResult.text,
        confidence: 0.8 // Default confidence for buffer transcription
      }
      
    } catch (error) {
      console.error('❌ Whisper buffer transcription failed:', error)
      throw error
    }
  }
  
  // ==========================
  // COMPREHENSIVE CALL ANALYSIS
  // ==========================
  
  async analyzeCall(transcription: CallTranscription): Promise<CallAnalytics> {
    console.log('🧠 Starting comprehensive call analysis for:', transcription.call_id)
    
    try {
      // Prepare analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(transcription)
      
      // Get AI analysis
      const aiAnalysis = await this.getAIAnalysis(analysisPrompt, transcription.transcript)
      
      // Parse and structure the analysis
      const structuredAnalysis = await this.parseAIAnalysis(aiAnalysis)
      
      // Calculate additional metrics
      const conversationMetrics = this.calculateConversationMetrics(transcription.transcript)
      
      // Detect forbidden words and compliance issues
      const complianceAnalysis = this.analyzeCompliance(transcription.transcript)
      
      // Create comprehensive analytics record
      const analytics: Omit<CallAnalytics, 'id' | 'created_at' | 'updated_at'> = {
        call_id: transcription.call_id,
        
        // Sentiment Analysis
        overall_sentiment: structuredAnalysis.overall_sentiment,
        sentiment_score: structuredAnalysis.sentiment_score,
        client_sentiment: structuredAnalysis.client_sentiment,
        agent_sentiment: structuredAnalysis.agent_sentiment,
        
        // Call Intent & Topics
        call_intent: structuredAnalysis.call_intent,
        key_topics: structuredAnalysis.key_topics,
        business_outcomes: structuredAnalysis.business_outcomes,
        action_items: structuredAnalysis.action_items,
        
        // Behavioral Analysis
        agent_performance: structuredAnalysis.agent_performance,
        client_behavior: structuredAnalysis.client_behavior,
        
        // Compliance
        forbidden_words_detected: complianceAnalysis.forbidden_words,
        compliance_issues: complianceAnalysis.issues,
        risk_level: complianceAnalysis.risk_level,
        
        // Conversation Metrics
        talk_time_ratio: conversationMetrics.talk_time_ratio,
        interruptions: conversationMetrics.interruptions,
        silent_periods: conversationMetrics.silent_periods,
        call_quality_score: conversationMetrics.quality_score,
        
        // Business Intelligence
        quote_discussed: structuredAnalysis.quote_discussed,
        budget_mentioned: structuredAnalysis.budget_mentioned,
        timeline_discussed: structuredAnalysis.timeline_discussed,
        next_steps_agreed: structuredAnalysis.next_steps_agreed,
        follow_up_required: structuredAnalysis.follow_up_required
      }
      
      // Store analytics
      const { data: analyticsRecord, error } = await query(`
        INSERT INTO call_analytics (
          call_id,
          overall_sentiment,
          sentiment_score,
          client_sentiment,
          agent_sentiment,
          call_intent,
          key_topics,
          business_outcomes,
          action_items,
          agent_performance,
          client_behavior,
          forbidden_words_detected,
          compliance_issues,
          risk_level,
          talk_time_ratio,
          interruptions,
          silent_periods,
          call_quality_score,
          quote_discussed,
          budget_mentioned,
          timeline_discussed,
          next_steps_agreed,
          follow_up_required,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING *
      `, [
        analytics.call_id,
        analytics.overall_sentiment,
        analytics.sentiment_score,
        analytics.client_sentiment,
        analytics.agent_sentiment,
        analytics.call_intent,
        analytics.key_topics,
        analytics.business_outcomes,
        analytics.action_items,
        analytics.agent_performance,
        analytics.client_behavior,
        analytics.forbidden_words_detected,
        analytics.compliance_issues,
        analytics.risk_level,
        analytics.talk_time_ratio,
        analytics.interruptions,
        analytics.silent_periods,
        analytics.call_quality_score,
        analytics.quote_discussed,
        analytics.budget_mentioned,
        analytics.timeline_discussed,
        analytics.next_steps_agreed,
        analytics.follow_up_required,
        new Date().toISOString(),
        new Date().toISOString()
      ])
      
      if (error) throw error
      
      console.log('✅ Call analysis completed:', analyticsRecord.id)
      
      // Generate and store insights
      await this.generateCallInsights(analyticsRecord)
      
      // Update unified client profile
      await this.updateUnifiedClientProfile(transcription, analyticsRecord)
      
      // Trigger follow-up actions if needed
      await this.triggerFollowUpActions(transcription, analyticsRecord)
      
      return analyticsRecord
      
    } catch (error) {
      console.error('❌ Call analysis failed:', error)
      throw error
    }
  }
  
  private buildAnalysisPrompt(transcription: CallTranscription): string {
    return `
You are an expert call analytics AI specialized in sales conversation analysis for OOAK Photography.

ANALYSIS REQUIREMENTS:
1. SENTIMENT ANALYSIS: Determine overall, client, and agent sentiment (-1.0 to 1.0)
2. INTENT DETECTION: Identify primary call purpose
3. TOPIC EXTRACTION: Key discussion points
4. BEHAVIORAL ANALYSIS: Rate agent performance and client engagement
5. BUSINESS INTELLIGENCE: Identify outcomes, next steps, business insights

BUSINESS CONTEXT:
- Company: OOAK Photography (Wedding & Event Photography)
- Services: Wedding photography, pre-wedding shoots, portraits, events
- Packages: Essential ₹75k, Premium ₹1.25L, Luxury ₹2L
- Client: ${transcription.client_name}
- Agent: ${transcription.sales_agent}
- Duration: ${transcription.duration} seconds

SCORING GUIDELINES:
- Professionalism: 1-10 (courtesy, language, expertise demonstration)
- Responsiveness: 1-10 (answer quality, speed, relevance)
- Knowledge: 1-10 (product knowledge, accurate information)
- Closing Effectiveness: 1-10 (next steps, commitment securing)

FORBIDDEN WORDS TO DETECT:
- Inappropriate language, discriminatory terms
- Misleading claims, false promises
- Pressure tactics, manipulative language
- Confidential information leaks

Return analysis in JSON format with all required fields.
`
  }
  
  private async getAIAnalysis(prompt: string, transcript: string): Promise<any> {
    try {
      const fullPrompt = `${prompt}\n\nCALL TRANSCRIPT:\n${transcript}\n\nProvide comprehensive JSON analysis:`
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b',
          prompt: fullPrompt,
          stream: false,
          format: 'json'
        })
      })
      
      if (!response.ok) throw new Error('Ollama API error')
      
      const result = await response.json()
      return JSON.parse(result.response)
      
    } catch (error) {
      console.error('❌ AI analysis failed:', error)
      // Return default analysis structure
      return this.getDefaultAnalysis()
    }
  }
  
  private async parseAIAnalysis(aiAnalysis: any): Promise<any> {
    // Structure and validate AI analysis results
    return {
      overall_sentiment: aiAnalysis.overall_sentiment || 'neutral',
      sentiment_score: aiAnalysis.sentiment_score || 0,
      client_sentiment: aiAnalysis.client_sentiment || 'neutral',
      agent_sentiment: aiAnalysis.agent_sentiment || 'neutral',
      call_intent: aiAnalysis.call_intent || 'general_inquiry',
      key_topics: aiAnalysis.key_topics || [],
      business_outcomes: aiAnalysis.business_outcomes || [],
      action_items: aiAnalysis.action_items || [],
      agent_performance: {
        professionalism_score: aiAnalysis.agent_performance?.professionalism_score || 7,
        responsiveness_score: aiAnalysis.agent_performance?.responsiveness_score || 7,
        knowledge_score: aiAnalysis.agent_performance?.knowledge_score || 7,
        closing_effectiveness: aiAnalysis.agent_performance?.closing_effectiveness || 7
      },
      client_behavior: {
        engagement_level: aiAnalysis.client_behavior?.engagement_level || 'medium',
        interest_level: aiAnalysis.client_behavior?.interest_level || 'medium',
        objection_handling: aiAnalysis.client_behavior?.objection_handling || [],
        buying_signals: aiAnalysis.client_behavior?.buying_signals || []
      },
      quote_discussed: aiAnalysis.quote_discussed || false,
      budget_mentioned: aiAnalysis.budget_mentioned || false,
      timeline_discussed: aiAnalysis.timeline_discussed || false,
      next_steps_agreed: aiAnalysis.next_steps_agreed || false,
      follow_up_required: aiAnalysis.follow_up_required || true
    }
  }
  
  private calculateConversationMetrics(transcript: string): any {
    // Simple conversation metrics calculation
    const lines = transcript.split('\n').filter(line => line.trim())
    const agentLines = lines.filter(line => line.toLowerCase().includes('agent:') || line.toLowerCase().includes('vikas:'))
    const clientLines = lines.filter(line => line.toLowerCase().includes('client:') || line.toLowerCase().includes('customer:'))
    
    return {
      talk_time_ratio: agentLines.length / Math.max(clientLines.length, 1),
      interruptions: 0, // Would need more sophisticated analysis
      silent_periods: 0, // Would need audio analysis
      quality_score: Math.min(8.5, Math.max(6.0, 8 - Math.abs(2 - (agentLines.length / Math.max(clientLines.length, 1)))))
    }
  }
  
  private analyzeCompliance(transcript: string): any {
    const forbiddenWords = [
      'guaranteed', 'promise', 'definitely will', 'best price ever',
      'limited time only', 'must decide now', 'final offer'
    ]
    
    const detected = forbiddenWords.filter(word => 
      transcript.toLowerCase().includes(word.toLowerCase())
    )
    
    return {
      forbidden_words: detected,
      issues: detected.length > 0 ? ['Potentially misleading language detected'] : [],
      risk_level: detected.length > 2 ? 'high' : detected.length > 0 ? 'medium' : 'low'
    }
  }
  
  private getDefaultAnalysis(): any {
    return {
      overall_sentiment: 'neutral',
      sentiment_score: 0,
      client_sentiment: 'neutral',
      agent_sentiment: 'neutral',
      call_intent: 'general_inquiry',
      key_topics: [],
      business_outcomes: [],
      action_items: [],
      agent_performance: {
        professionalism_score: 7,
        responsiveness_score: 7,
        knowledge_score: 7,
        closing_effectiveness: 7
      },
      client_behavior: {
        engagement_level: 'medium',
        interest_level: 'medium',
        objection_handling: [],
        buying_signals: []
      },
      quote_discussed: false,
      budget_mentioned: false,
      timeline_discussed: false,
      next_steps_agreed: false,
      follow_up_required: true
    }
  }
  
  // ==========================
  // UNIFIED CLIENT PROFILE UPDATE
  // ==========================
  
  private async updateUnifiedClientProfile(
    transcription: CallTranscription, 
    analytics: CallAnalytics
  ): Promise<void> {
    console.log('📊 Updating unified client profile with call insights')
    
    try {
      // Find or create client entity
      const { data: existingClient, error: findError } = await query(`
        SELECT * FROM business_entities WHERE entity_type = 'client' AND (phone = $1 OR name ILIKE $2)
      `, [
        transcription.phone_number,
        `%${transcription.client_name}%`
      ])
      
      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding client:', findError)
        return
      }
      
      let clientEntity = existingClient[0]
      
      if (!clientEntity) {
        // Create new client entity
        const { data: newClient, error: createError } = await query(`
          INSERT INTO business_entities (entity_type, name, phone, ai_insights, created_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          'client',
          transcription.client_name,
          transcription.phone_number,
          {
            communication_preferences: [],
            interaction_history: [],
            behavior_patterns: []
          },
          new Date().toISOString()
        ])
        
        if (createError) {
          console.error('Error creating client entity:', createError)
          return
        }
        
        clientEntity = newClient
      }
      
      // Update client insights with call data
      const updatedInsights = {
        ...clientEntity.ai_insights,
        last_call_sentiment: analytics.client_sentiment,
        call_behavior: {
          engagement_level: analytics.client_behavior.engagement_level,
          interest_level: analytics.client_behavior.interest_level,
          buying_signals: analytics.client_behavior.buying_signals,
          objections: analytics.client_behavior.objection_handling
        },
        business_interests: analytics.key_topics,
        last_interaction: transcription.created_at,
        total_call_interactions: (clientEntity.ai_insights?.total_call_interactions || 0) + 1
      }
      
      // Update client entity
      await query(`
        UPDATE business_entities SET ai_insights = $1, updated_at = $2 WHERE id = $3
      `, [
        updatedInsights,
        new Date().toISOString(),
        clientEntity.id
      ])
      
      console.log('✅ Client profile updated with call insights')
      
    } catch (error) {
      console.error('❌ Error updating client profile:', error)
    }
  }
  
  // ==========================
  // FOLLOW-UP ACTIONS
  // ==========================
  
  private async triggerFollowUpActions(
    transcription: CallTranscription,
    analytics: CallAnalytics
  ): Promise<void> {
    console.log('🎯 Triggering follow-up actions based on call analysis')
    
    try {
      const followUpTasks = []
      
      // Generate follow-up tasks based on call outcomes
      if (analytics.follow_up_required) {
        if (analytics.quote_discussed && !analytics.next_steps_agreed) {
          followUpTasks.push({
            title: `Follow up on quote discussion - ${transcription.client_name}`,
            description: `Client discussed quotation during call but no next steps were agreed. Follow up to clarify requirements and provide formal quote.`,
            priority: 'high',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            task_type: 'quotation_follow_up',
            client_name: transcription.client_name,
            estimated_value: 75000, // Default estimation
            business_impact: 'Quote Follow-up • Client Engagement • Revenue Opportunity',
            ai_reasoning: `Call analysis indicates quote discussion without closure. Client sentiment: ${analytics.client_sentiment}. Immediate follow-up required.`
          })
        }
        
        if (analytics.client_behavior.interest_level === 'high' && analytics.overall_sentiment === 'positive') {
          followUpTasks.push({
            title: `High-interest client follow-up - ${transcription.client_name}`,
            description: `Client showed high interest during call with positive sentiment. Schedule detailed consultation or send portfolio.`,
            priority: 'urgent',
            due_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            task_type: 'lead_follow_up',
            client_name: transcription.client_name,
            estimated_value: 125000, // Higher estimation for interested clients
            business_impact: 'High-Potential Conversion • Immediate Opportunity • Revenue Priority',
            ai_reasoning: `Call analysis shows high client interest (${analytics.client_behavior.interest_level}) with positive sentiment (${analytics.overall_sentiment}). Priority follow-up required.`
          })
        }
        
        if (analytics.compliance_issues.length > 0 || analytics.risk_level === 'high') {
          followUpTasks.push({
            title: `Call compliance review - ${transcription.client_name}`,
            description: `Call analysis detected compliance issues that need management review. Issues: ${analytics.compliance_issues.join(', ')}`,
            priority: 'urgent',
            due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            task_type: 'compliance_review',
            client_name: transcription.client_name,
            estimated_value: 0,
            business_impact: 'Compliance Risk Management • Legal Protection • Quality Assurance',
            ai_reasoning: `Compliance issues detected: ${analytics.compliance_issues.join(', ')}. Risk level: ${analytics.risk_level}. Immediate management review required.`
          })
        }
      }
      
      // Create the follow-up tasks
      for (const task of followUpTasks) {
        const { error } = await query(`
          INSERT INTO ai_tasks (
            task_title,
            task_description,
            priority,
            status,
            due_date,
            category,
            assigned_to,
            assigned_by,
            client_name,
            business_impact,
            ai_reasoning,
            estimated_value,
            lead_id,
            metadata,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          task.title,
          task.description,
          task.priority,
          'pending',
          task.due_date,
          'call_followup',
          transcription.sales_agent,
          'AI Call Analytics',
          task.client_name,
          task.business_impact,
          task.ai_reasoning,
          task.estimated_value,
          transcription.lead_id,
          {
            call_id: transcription.call_id,
            task_type: task.task_type,
            ai_generated: true,
            call_analytics: true,
            sentiment: analytics.overall_sentiment,
            risk_level: analytics.risk_level
          },
          new Date().toISOString()
        ])
        
        if (error) {
          console.error('❌ Error creating follow-up task:', error)
        } else {
          console.log('✅ Created follow-up task:', task.title)
        }
      }
      
    } catch (error) {
      console.error('❌ Error triggering follow-up actions:', error)
    }
  }
  
  private async updateTaskWithTranscription(taskId: string, transcriptionId: string): Promise<void> {
    try {
      const { error } = await query(`
        UPDATE ai_tasks SET metadata = $1, updated_at = $2 WHERE id = $3
      `, [
        {
          call_transcription_id: transcriptionId,
          call_completed: true,
          transcription_available: true
        },
        new Date().toISOString(),
        taskId
      ])
      
      if (error) {
        console.error('❌ Error updating task with transcription:', error)
      } else {
        console.log('✅ Task updated with transcription link')
      }
    } catch (error) {
      console.error('❌ Error in updateTaskWithTranscription:', error)
    }
  }
  
  // ==========================
  // INSIGHTS GENERATION
  // ==========================
  
  private async generateCallInsights(analytics: CallAnalytics): Promise<void> {
    console.log('💡 Generating business insights from call analysis')
    
    try {
      // This would generate insights for management dashboard
      const insights = {
        sales_performance: {
          agent_effectiveness: (
            analytics.agent_performance.professionalism_score +
            analytics.agent_performance.responsiveness_score +
            analytics.agent_performance.knowledge_score +
            analytics.agent_performance.closing_effectiveness
          ) / 4,
          client_satisfaction_indicator: analytics.client_sentiment === 'positive' ? 1 : analytics.client_sentiment === 'negative' ? -1 : 0,
          conversion_probability: this.calculateConversionProbability(analytics)
        },
        business_intelligence: {
          call_quality: analytics.call_quality_score,
          compliance_status: analytics.risk_level,
          follow_up_priority: analytics.follow_up_required ? 1 : 0
        }
      }
      
      // Store insights (would be used for management reporting)
      console.log('📊 Call insights generated:', insights)
      
    } catch (error) {
      console.error('❌ Error generating insights:', error)
    }
  }
  
  private calculateConversionProbability(analytics: CallAnalytics): number {
    let probability = 0.5 // Base probability
    
    // Positive sentiment increases probability
    if (analytics.client_sentiment === 'positive') probability += 0.2
    if (analytics.overall_sentiment === 'positive') probability += 0.1
    
    // High interest increases probability
    if (analytics.client_behavior.interest_level === 'high') probability += 0.2
    
    // Business discussions increase probability
    if (analytics.budget_mentioned) probability += 0.1
    if (analytics.timeline_discussed) probability += 0.1
    if (analytics.next_steps_agreed) probability += 0.15
    
    // Buying signals increase probability
    probability += analytics.client_behavior.buying_signals.length * 0.05
    
    // Objections decrease probability
    probability -= analytics.client_behavior.objection_handling.length * 0.05
    
    return Math.min(0.95, Math.max(0.05, probability))
  }
  
  // ==========================
  // ANALYTICS DASHBOARD METHODS
  // ==========================
  
  async getCallAnalyticsSummary(filters: {
    date_from?: string
    date_to?: string
    agent?: string
    client?: string
  } = {}): Promise<any> {
    try {
      let query = query(`
        SELECT
          ca.*,
          ct.client_name,
          ct.sales_agent,
          ct.duration,
          ct.created_at
        FROM
          call_analytics ca
        JOIN
          call_transcriptions ct ON ca.call_id = ct.call_id
      `)
      
      if (filters.date_from) {
        query = query.andWhere('ct.created_at >=', filters.date_from)
      }
      
      if (filters.date_to) {
        query = query.andWhere('ct.created_at <=', filters.date_to)
      }
      
      if (filters.agent) {
        query = query.andWhere('ct.sales_agent ILIKE', `%${filters.agent}%`)
      }
      
      if (filters.client) {
        query = query.andWhere('ct.client_name ILIKE', `%${filters.client}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Calculate summary metrics
      const summary = {
        total_calls: data.length,
        avg_sentiment: data.reduce((acc, call) => acc + call.sentiment_score, 0) / data.length,
        avg_quality: data.reduce((acc, call) => acc + call.call_quality_score, 0) / data.length,
        high_risk_calls: data.filter(call => call.risk_level === 'high').length,
        follow_ups_required: data.filter(call => call.follow_up_required).length,
        sentiment_distribution: {
          positive: data.filter(call => call.overall_sentiment === 'positive').length,
          neutral: data.filter(call => call.overall_sentiment === 'neutral').length,
          negative: data.filter(call => call.overall_sentiment === 'negative').length
        }
      }
      
      return { summary, details: data }
      
    } catch (error) {
      console.error('❌ Error getting analytics summary:', error)
      throw error
    }
  }
}

export const callAnalyticsService = new CallAnalyticsService()