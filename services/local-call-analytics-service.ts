import { query, transaction } from '@/lib/postgresql-client'
import { UniversalBusinessIntelligenceService } from './universal-business-intelligence-service'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { v4 as uuidv4 } from 'uuid'

const universalBI = new UniversalBusinessIntelligenceService()

// ==========================
// FREE LOCAL CALL ANALYTICS
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
  
  // Agent Performance Scores (1-10)
  agent_professionalism_score: number
  agent_responsiveness_score: number
  agent_knowledge_score: number
  agent_closing_effectiveness: number
  
  // Client Behavior
  client_engagement_level: 'high' | 'medium' | 'low'
  client_interest_level: 'high' | 'medium' | 'low'
  client_objection_handling: string[]
  client_buying_signals: string[]
  
  // Forbidden Words & Compliance
  forbidden_words_detected: string[]
  compliance_issues: string[]
  risk_level: 'low' | 'medium' | 'high'
  
  // Conversation Insights
  talk_time_ratio: number
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

export class LocalCallAnalyticsService {
  private uploadsDir = path.join(process.cwd(), 'uploads', 'call-recordings')
  
  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true })
    }
  }
  
  // ==========================
  // FREE LOCAL TRANSCRIPTION
  // ==========================
  
  async transcribeCallFromUpload(callData: {
    call_id: string
    task_id?: string
    lead_id?: number
    client_name: string
    sales_agent: string
    phone_number: string
    audio_file: Buffer
    original_filename: string
    duration?: number
  }): Promise<CallTranscription> {
    console.log('🎙️ Starting LOCAL transcription with PostgreSQL backend:', callData.call_id)
    
    try {
      // Save uploaded file
      const filename = `${callData.call_id}_${Date.now()}.wav`
      const filepath = path.join(this.uploadsDir, filename)
      
      fs.writeFileSync(filepath, callData.audio_file)
      console.log('📁 Audio file saved:', filepath)
      
      // Transcribe using local Whisper
      const transcript = await this.localWhisperTranscription(filepath)
      
      // Calculate duration if not provided
      const duration = callData.duration || await this.getAudioDuration(filepath)
      
      // Store transcription in PostgreSQL
      const transcriptionId = uuidv4()
      const now = new Date().toISOString()
      
      const result = await query(`
        INSERT INTO call_transcriptions (
          id, call_id, task_id, lead_id, client_name, sales_agent, phone_number,
          duration, recording_url, transcript, confidence_score, language, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *
      `, [
        transcriptionId, callData.call_id, callData.task_id, callData.lead_id,
        callData.client_name, callData.sales_agent, callData.phone_number,
        duration, filepath, transcript.text, transcript.confidence, 'en', now
      ])
      
      const transcriptionRecord = result.rows[0]
      console.log('✅ Local transcription completed and stored in PostgreSQL:', transcriptionRecord.id)
      
      // Trigger analytics processing
      await this.analyzeCall(transcriptionRecord)
      
      // Update task with transcription link
      if (callData.task_id) {
        await this.updateTaskWithTranscription(callData.task_id, transcriptionRecord.id)
      }
      
      return transcriptionRecord
      
    } catch (error) {
      console.error('❌ Local transcription failed:', error)
      throw error
    }
  }
  
  // ==========================
  // LOCAL WHISPER INTEGRATION
  // ==========================
  
  private async localWhisperTranscription(audioFilePath: string): Promise<{text: string, confidence: number}> {
    try {
      console.log('🎵 Using LOCAL Whisper for transcription...')
      
      // Check if whisper is installed
      const whisperAvailable = await this.checkWhisperInstallation()
      if (!whisperAvailable) {
        throw new Error('Whisper not installed. Please install with: pip install openai-whisper')
      }
      
      // Run local whisper command
      const transcript = await this.runWhisperCommand(audioFilePath)
      
      return {
        text: transcript,
        confidence: 0.85 // Local whisper doesn't provide confidence, use default good score
      }
      
    } catch (error) {
      console.error('❌ Local Whisper transcription failed:', error)
      
      // Fallback to simple filename-based transcript for demo
      return {
        text: `[Transcription placeholder for ${path.basename(audioFilePath)}. Install Whisper with: pip install openai-whisper]`,
        confidence: 0.5
      }
    }
  }
  
  private async checkWhisperInstallation(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check for faster-whisper in our virtual environment
      const process = spawn('bash', ['-c', 'source whisper-env/bin/activate && python scripts/faster-whisper-transcribe.py --help'])
      
      process.on('error', () => resolve(false))
      process.on('close', (code) => resolve(code === 0))
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000)
    })
  }
  
  private async runWhisperCommand(audioFilePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Use our faster-whisper Python script
      const process = spawn('bash', ['-c', `source whisper-env/bin/activate && python scripts/faster-whisper-transcribe.py "${audioFilePath}" --model base`])
      
      let output = ''
      let error = ''
      
      process.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      process.stderr.on('data', (data) => {
        error += data.toString()
        console.log('Whisper progress:', data.toString())
      })
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse JSON output from our Python script
            const result = JSON.parse(output.trim())
            if (result.success) {
              resolve(result.transcript)
            } else {
              reject(new Error(`Faster-Whisper failed: ${result.error}`))
            }
          } catch (err) {
            reject(new Error(`Failed to parse transcription result: ${err}`))
          }
        } else {
          reject(new Error(`Faster-Whisper failed with code ${code}: ${error}`))
        }
      })
      
      // Timeout after 10 minutes for large files
      setTimeout(() => {
        process.kill()
        reject(new Error('Faster-Whisper transcription timeout'))
      }, 600000)
    })
  }
  
  // ==========================
  // AUDIO UTILITIES
  // ==========================
  
  private async getAudioDuration(audioFilePath: string): Promise<number> {
    try {
      // Use ffprobe to get duration (if available)
      return new Promise((resolve) => {
        const process = spawn('ffprobe', [
          '-v', 'quiet',
          '-show_entries', 'format=duration',
          '-of', 'csv=p=0',
          audioFilePath
        ])
        
        let output = ''
        process.stdout.on('data', (data) => {
          output += data.toString()
        })
        
        process.on('close', (code) => {
          if (code === 0) {
            const duration = parseFloat(output.trim())
            resolve(duration || 300) // Default 5 minutes if parsing fails
          } else {
            resolve(300) // Default 5 minutes if ffprobe fails
          }
        })
        
        // Timeout
        setTimeout(() => {
          process.kill()
          resolve(300)
        }, 10000)
      })
    } catch (error) {
      console.error('❌ Duration calculation failed:', error)
      return 300 // Default 5 minutes
    }
  }
  
  // ==========================
  // ANALYTICS (LOCAL OLLAMA + POSTGRESQL)
  // ==========================
  
  async analyzeCall(transcription: CallTranscription): Promise<CallAnalytics> {
    console.log('🧠 Starting LOCAL call analysis with PostgreSQL storage for:', transcription.call_id)
    
    try {
      // Use LOCAL Ollama for analysis
      const analysisPrompt = this.buildAnalysisPrompt(transcription)
      const aiAnalysis = await this.getLocalAIAnalysis(analysisPrompt, transcription.transcript)
      const structuredAnalysis = await this.parseAIAnalysis(aiAnalysis)
      
      // Calculate additional metrics
      const conversationMetrics = this.calculateConversationMetrics(transcription.transcript)
      const complianceAnalysis = this.analyzeCompliance(transcription.transcript)
      
      // Create comprehensive analytics record
      const analyticsId = uuidv4()
      const now = new Date().toISOString()
      
      const result = await query(`
        INSERT INTO call_analytics (
          id, call_id, overall_sentiment, sentiment_score, client_sentiment, agent_sentiment,
          call_intent, key_topics, business_outcomes, action_items,
          agent_professionalism_score, agent_responsiveness_score, agent_knowledge_score, agent_closing_effectiveness,
          client_engagement_level, client_interest_level, client_objection_handling, client_buying_signals,
          forbidden_words_detected, compliance_issues, risk_level,
          talk_time_ratio, interruptions, silent_periods, call_quality_score,
          quote_discussed, budget_mentioned, timeline_discussed, next_steps_agreed, follow_up_required,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $31
        ) RETURNING *
      `, [
        analyticsId, transcription.call_id,
        structuredAnalysis.overall_sentiment, structuredAnalysis.sentiment_score,
        structuredAnalysis.client_sentiment, structuredAnalysis.agent_sentiment,
        structuredAnalysis.call_intent, JSON.stringify(structuredAnalysis.key_topics),
        JSON.stringify(structuredAnalysis.business_outcomes), JSON.stringify(structuredAnalysis.action_items),
        structuredAnalysis.agent_performance.professionalism_score, structuredAnalysis.agent_performance.responsiveness_score,
        structuredAnalysis.agent_performance.knowledge_score, structuredAnalysis.agent_performance.closing_effectiveness,
        structuredAnalysis.client_behavior.engagement_level, structuredAnalysis.client_behavior.interest_level,
        JSON.stringify(structuredAnalysis.client_behavior.objection_handling), JSON.stringify(structuredAnalysis.client_behavior.buying_signals),
        JSON.stringify(complianceAnalysis.forbidden_words), JSON.stringify(complianceAnalysis.issues), complianceAnalysis.risk_level,
        conversationMetrics.talk_time_ratio, conversationMetrics.interruptions, conversationMetrics.silent_periods, conversationMetrics.quality_score,
        structuredAnalysis.quote_discussed, structuredAnalysis.budget_mentioned, structuredAnalysis.timeline_discussed,
        structuredAnalysis.next_steps_agreed, structuredAnalysis.follow_up_required, now
      ])
      
      const analyticsRecord = result.rows[0]
      console.log('✅ LOCAL call analysis completed and stored in PostgreSQL:', analyticsRecord.id)
      
      // Parse JSON fields back
      const parsedAnalytics = this.parseAnalyticsData(analyticsRecord)
      
      // Update unified client profile
      await this.updateUnifiedClientProfile(transcription, parsedAnalytics)
      
      // Trigger follow-up actions
      await this.triggerFollowUpActions(transcription, parsedAnalytics)
      
      return parsedAnalytics
      
    } catch (error) {
      console.error('❌ LOCAL call analysis failed:', error)
      throw error
    }
  }
  
  private buildAnalysisPrompt(transcription: CallTranscription): string {
    return `
You are an expert call analytics AI for OOAK Photography with PostgreSQL-powered business intelligence.

ANALYSIS REQUIREMENTS:
1. SENTIMENT ANALYSIS: Overall, client, agent sentiment (-1.0 to 1.0)
2. INTENT DETECTION: Primary call purpose
3. TOPIC EXTRACTION: Key discussion points
4. BEHAVIORAL ANALYSIS: Agent performance and client engagement
5. BUSINESS INTELLIGENCE: Outcomes, next steps, insights

BUSINESS CONTEXT:
- Company: OOAK Photography (Wedding & Event Photography)
- Services: Wedding photography, pre-wedding shoots, portraits, events
- Packages: Essential ₹75k, Premium ₹1.25L, Luxury ₹2L
- Client: ${transcription.client_name}
- Agent: ${transcription.sales_agent}
- Duration: ${transcription.duration} seconds

SCORING (1-10):
- Professionalism: Courtesy, language, expertise
- Responsiveness: Answer quality, speed, relevance
- Knowledge: Product knowledge, accuracy
- Closing: Next steps, commitment securing

Return analysis in JSON format with all required fields.
`
  }
  
  private async getLocalAIAnalysis(prompt: string, transcript: string): Promise<any> {
    try {
      const fullPrompt = `${prompt}\n\nCALL TRANSCRIPT:\n${transcript}\n\nProvide comprehensive JSON analysis:`
      
      // Use LOCAL Ollama
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
      console.error('❌ Local AI analysis failed:', error)
      return this.getDefaultAnalysis()
    }
  }
  
  private async parseAIAnalysis(aiAnalysis: any): Promise<any> {
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
    const lines = transcript.split('\n').filter(line => line.trim())
    const agentLines = lines.filter(line => line.toLowerCase().includes('agent:') || line.toLowerCase().includes('vikas:'))
    const clientLines = lines.filter(line => line.toLowerCase().includes('client:') || line.toLowerCase().includes('customer:'))
    
    return {
      talk_time_ratio: agentLines.length / Math.max(clientLines.length, 1),
      interruptions: 0,
      silent_periods: 0,
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
  
  private async updateUnifiedClientProfile(transcription: CallTranscription, analytics: CallAnalytics): Promise<void> {
    console.log('📊 Updating unified client profile with call insights using PostgreSQL')
    
    try {
      // Find existing client entity
      const existingResult = await query(`
        SELECT * FROM business_entities 
        WHERE entity_type = 'client' 
        AND (primary_phone = $1 OR name ILIKE $2)
        LIMIT 1
      `, [transcription.phone_number, `%${transcription.client_name}%`])
      
      let clientEntity = existingResult.rows[0]
      
      if (!clientEntity) {
        // Create new client entity
        const entityId = uuidv4()
        const now = new Date().toISOString()
        
        const createResult = await query(`
          INSERT INTO business_entities (
            id, entity_type, name, primary_phone, ai_insights, created_at, updated_at
          ) VALUES ($1, 'client', $2, $3, $4, $5, $5) RETURNING *
        `, [
          entityId, transcription.client_name, transcription.phone_number,
          JSON.stringify({
            communication_preferences: [],
            interaction_history: [],
            behavior_patterns: []
          }), now
        ])
        
        clientEntity = createResult.rows[0]
      }
      
      // Update insights
      const existingInsights = clientEntity.ai_insights ? JSON.parse(clientEntity.ai_insights) : {}
      const updatedInsights = {
        ...existingInsights,
        last_call_sentiment: analytics.client_sentiment,
        call_behavior: {
          engagement_level: analytics.client_engagement_level,
          interest_level: analytics.client_interest_level,
          buying_signals: analytics.client_buying_signals,
          objections: analytics.client_objection_handling
        },
        business_interests: analytics.key_topics,
        last_interaction: transcription.created_at,
        total_call_interactions: (existingInsights.total_call_interactions || 0) + 1
      }
      
      await query(`
        UPDATE business_entities 
        SET ai_insights = $1, updated_at = $2 
        WHERE id = $3
      `, [JSON.stringify(updatedInsights), new Date().toISOString(), clientEntity.id])
      
      console.log('✅ Client profile updated with call insights in PostgreSQL')
      
    } catch (error) {
      console.error('❌ Error updating client profile:', error)
    }
  }
  
  private async triggerFollowUpActions(transcription: CallTranscription, analytics: CallAnalytics): Promise<void> {
    console.log('🎯 Triggering follow-up actions based on call analysis using PostgreSQL')
    
    try {
      const followUpTasks = []
      
      if (analytics.follow_up_required) {
        if (analytics.quote_discussed && !analytics.next_steps_agreed) {
          followUpTasks.push({
            title: `Follow up on quote discussion - ${transcription.client_name}`,
            description: `Client discussed quotation during call but no next steps were agreed. Follow up to clarify requirements and provide formal quote.`,
            priority: 'HIGH',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            task_type: 'quotation_follow_up',
            client_name: transcription.client_name,
            estimated_value: 75000,
            business_impact: 'Quote Follow-up • Client Engagement • Revenue Opportunity',
            ai_reasoning: `LOCAL call analysis indicates quote discussion without closure. Client sentiment: ${analytics.client_sentiment}. Immediate follow-up required.`
          })
        }
        
        if (analytics.client_interest_level === 'high' && analytics.overall_sentiment === 'positive') {
          followUpTasks.push({
            title: `High-interest client follow-up - ${transcription.client_name}`,
            description: `Client showed high interest during call with positive sentiment. Schedule detailed consultation or send portfolio.`,
            priority: 'URGENT',
            due_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            task_type: 'lead_follow_up',
            client_name: transcription.client_name,
            estimated_value: 125000,
            business_impact: 'High-Potential Conversion • Immediate Opportunity • Revenue Priority',
            ai_reasoning: `LOCAL call analysis shows high client interest (${analytics.client_interest_level}) with positive sentiment (${analytics.overall_sentiment}). Priority follow-up required.`
          })
        }
      }
      
      // Create follow-up tasks in PostgreSQL
      for (const task of followUpTasks) {
        const taskId = uuidv4()
        const now = new Date().toISOString()
        
        const taskResult = await query(`
          INSERT INTO ai_tasks (
            id, task_title, task_description, priority, status, due_date, category,
            assigned_to, assigned_by, client_name, business_impact, ai_reasoning,
            estimated_value, lead_id, metadata, created_at
          ) VALUES (
            $1, $2, $3, $4, 'PENDING', $5, 'call_followup', $6, 'LOCAL AI Call Analytics',
            $7, $8, $9, $10, $11, $12, $13
          ) RETURNING id
        `, [
          taskId, task.title, task.description, task.priority, task.due_date,
          transcription.sales_agent, task.client_name, task.business_impact,
          task.ai_reasoning, task.estimated_value, transcription.lead_id,
          JSON.stringify({
            call_id: transcription.call_id,
            task_type: task.task_type,
            ai_generated: true,
            call_analytics: true,
            local_processing: true,
            sentiment: analytics.overall_sentiment,
            risk_level: analytics.risk_level
          }), now
        ])
        
        console.log('✅ Created LOCAL follow-up task in PostgreSQL:', task.title)
      }
      
    } catch (error) {
      console.error('❌ Error triggering follow-up actions:', error)
    }
  }
  
  private async updateTaskWithTranscription(taskId: string, transcriptionId: string): Promise<void> {
    try {
      await query(`
        UPDATE ai_tasks 
        SET metadata = jsonb_set(
          COALESCE(metadata, '{}'),
          '{call_transcription_id}',
          to_jsonb($1::text)
        ),
        metadata = jsonb_set(
          metadata,
          '{call_completed}',
          'true'
        ),
        metadata = jsonb_set(
          metadata,
          '{transcription_available}',
          'true'
        ),
        metadata = jsonb_set(
          metadata,
          '{local_processing}',
          'true'
        ),
        updated_at = $2
        WHERE id = $3
      `, [transcriptionId, new Date().toISOString(), taskId])
      
      console.log('✅ Task updated with LOCAL transcription link in PostgreSQL')
    } catch (error) {
      console.error('❌ Error updating task with transcription:', error)
    }
  }
  
  // ==========================
  // FILE MANAGEMENT
  // ==========================
  
  async cleanupOldRecordings(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000))
      
      // Get old transcriptions from PostgreSQL
      const result = await query(`
        SELECT recording_url FROM call_transcriptions 
        WHERE created_at < $1
      `, [cutoffDate.toISOString()])
      
      // Delete old files
      for (const row of result.rows) {
        if (row.recording_url && fs.existsSync(row.recording_url)) {
          fs.unlinkSync(row.recording_url)
          console.log('🗑️ Deleted old recording:', row.recording_url)
        }
      }
      
      console.log(`✅ Cleanup completed for recordings older than ${daysOld} days`)
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
    }
  }
  
  async getStorageStats(): Promise<{totalFiles: number, totalSize: number, oldestFile: string}> {
    try {
      const files = fs.readdirSync(this.uploadsDir)
      let totalSize = 0
      let oldestDate = new Date()
      let oldestFile = ''
      
      for (const file of files) {
        const filepath = path.join(this.uploadsDir, file)
        const stats = fs.statSync(filepath)
        totalSize += stats.size
        
        if (stats.birthtime < oldestDate) {
          oldestDate = stats.birthtime
          oldestFile = file
        }
      }
      
      return {
        totalFiles: files.length,
        totalSize: totalSize,
        oldestFile: oldestFile
      }
      
    } catch (error) {
      console.error('❌ Error getting storage stats:', error)
      return { totalFiles: 0, totalSize: 0, oldestFile: '' }
    }
  }

  // ==========================
  // DATA PARSING HELPERS
  // ==========================

  private parseAnalyticsData(row: any): CallAnalytics {
    return {
      ...row,
      key_topics: row.key_topics ? JSON.parse(row.key_topics) : [],
      business_outcomes: row.business_outcomes ? JSON.parse(row.business_outcomes) : [],
      action_items: row.action_items ? JSON.parse(row.action_items) : [],
      client_objection_handling: row.client_objection_handling ? JSON.parse(row.client_objection_handling) : [],
      client_buying_signals: row.client_buying_signals ? JSON.parse(row.client_buying_signals) : [],
      forbidden_words_detected: row.forbidden_words_detected ? JSON.parse(row.forbidden_words_detected) : [],
      compliance_issues: row.compliance_issues ? JSON.parse(row.compliance_issues) : []
    }
  }
}

export const localCallAnalyticsService = new LocalCallAnalyticsService() 