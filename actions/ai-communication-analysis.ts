import { query, transaction } from '@/lib/postgresql-client'

// Local LLM Configuration - Using your installed models
const LLAMA_API_URL = process.env.LLAMA_API_URL || 'http://localhost:11434/api/generate'
const LLAMA_MODEL = process.env.LLAMA_MODEL || 'qwen2.5:7b' // Best model for structured responses

// Local LLM API call function
async function callLocalLLM(prompt: string): Promise<string> {
  try {
    console.log('🤖 Calling Qwen 2.5:7b model...')
    
    const response = await fetch(LLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 1500, // Max tokens for response
          stop: ["</response>", "\n\n---"]
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Llama API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.response) {
      throw new Error('No response from Llama model')
    }
    
         console.log('✅ Qwen 2.5 response received')
    return result.response.trim()
    
  } catch (error) {
    console.error('❌ Local LLM call failed:', error)
    // Fallback response if LLM fails
    return JSON.stringify({
      overall_sentiment: "neutral",
      business_probability: 50,
      revision_likelihood: 30,
      conversation_summary: "Unable to analyze conversation - LLM connection failed",
      key_insights: ["Technical analysis unavailable"],
      client_concerns: [],
      recommended_tasks: [{
        task_type: "follow_up",
        title: "Manual Review Required",
        description: "AI analysis failed - please review conversation manually",
        priority: "medium",
        due_hours: 24,
        ai_reasoning: "Fallback task due to LLM connection issue"
      }],
      next_follow_up_timing: "tomorrow"
    })
  }
}

// Types for AI analysis
export interface WhatsAppMessage {
  id: number
  quotation_id: number
  client_phone: string
  message_text: string
  message_type: 'incoming' | 'outgoing'
  timestamp: string
  interakt_message_id?: string
  ai_analyzed: boolean
}

export interface MessageAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'urgent'
  sentiment_score: number // -1 to 1
  intent: string
  urgency_level: number // 1-5
  key_topics: string[]
  recommended_action: string
  confidence_score: number
}

export interface ConversationInsights {
  overall_sentiment: string
  business_probability: number // 0-100
  revision_likelihood: number // 0-100
  recommended_tasks: AITaskRecommendation[]
  conversation_summary: string
  next_follow_up_timing: string
}

export interface AITaskRecommendation {
  task_type: 'follow_up' | 'urgent_call' | 'quotation_revision' | 'send_info' | 'closing_attempt'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  due_date: string
  ai_reasoning: string
}

/**
 * Main function to analyze WhatsApp messages and generate AI insights
 */
export async function analyzeClientCommunication(quotationId: number): Promise<{
  success: boolean
  insights?: ConversationInsights
  error?: string
}> {
  try {
    console.log(`🧠 Starting Qwen 2.5 analysis for quotation ${quotationId}`)
    
    // Get all messages for this quotation
    const messagesResult = await query(
      `SELECT * FROM whatsapp_messages 
       WHERE quotation_id = $1 
       ORDER BY timestamp ASC`,
      [quotationId]
    )
    
    const messages = messagesResult.rows
    
    if (!messages || messages.length === 0) {
      console.log('No messages found for analysis')
      return { success: false, error: 'No messages found for analysis' }
    }
    
    // Get quotation details for context
    const quotationResult = await query(
      `SELECT quotation_number, client_name, total_amount, status 
       FROM quotations 
       WHERE id = $1`,
      [quotationId]
    )
    
    const quotation = quotationResult.rows[0]
    
    // Analyze the conversation with Llama 3.2
    const insights = await performAIAnalysis(messages, quotation)
    
    // Store analysis results
    await storeAnalysisResults(quotationId, messages, insights)
    
    // Generate and create AI tasks
    await createAITasks(quotationId, insights)
    
    console.log(`✅ Llama 3.2 analysis completed for quotation ${quotationId}`)
    return { success: true, insights }
    
  } catch (error: any) {
    console.error('Error in AI communication analysis:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Core AI analysis using Local Llama 3.2 Model
 */
async function performAIAnalysis(
  messages: WhatsAppMessage[], 
  quotation: any
): Promise<ConversationInsights> {
  try {
    // Prepare conversation context
    const conversationText = messages.map(msg => 
      `[${msg.timestamp}] ${msg.message_type === 'incoming' ? 'CLIENT' : 'SALES_AGENT'}: ${msg.message_text}`
    ).join('\n')
    
    // Enhanced prompt for Llama 3.2 with clear instructions
    const analysisPrompt = `You are an expert sales intelligence AI for a wedding photography business. Analyze this client conversation carefully.

QUOTATION CONTEXT:
- Quotation Number: ${quotation?.quotation_number || 'N/A'}
- Client: ${quotation?.client_name || 'N/A'}
- Amount: ₹${quotation?.total_amount?.toLocaleString() || 'N/A'}
- Status: ${quotation?.status || 'pending'}

CONVERSATION TIMELINE:
${conversationText}

INSTRUCTIONS: Analyze this conversation and respond with ONLY valid JSON in this exact format:

{
  "overall_sentiment": "positive|negative|neutral|mixed",
  "business_probability": 0-100,
  "revision_likelihood": 0-100,
  "conversation_summary": "Brief summary of conversation",
  "key_insights": ["insight1", "insight2", "insight3"],
  "client_concerns": ["concern1", "concern2"],
  "recommended_tasks": [
    {
      "task_type": "follow_up",
      "title": "Task title",
      "description": "Detailed description",
      "priority": "medium",
      "due_hours": 24,
      "ai_reasoning": "Why this task is recommended"
    }
  ],
  "next_follow_up_timing": "immediate|in_few_hours|tomorrow|next_week|not_needed"
}

ANALYSIS FOCUS:
1. Client sentiment and engagement level
2. Purchase intent and closure probability
3. Any concerns or objections raised
4. Need for quotation revisions
5. Urgency of follow-up required

Respond with valid JSON only. No additional text.`

    console.log('🦙 Sending conversation to Llama 3.2 for analysis...')
    const llamaResponse = await callLocalLLM(analysisPrompt)
    
    // Extract JSON from Llama response (sometimes includes extra text)
    let jsonString = llamaResponse.trim()
    
    // Find JSON boundaries
    const jsonStart = jsonString.indexOf('{')
    const jsonEnd = jsonString.lastIndexOf('}') + 1
    
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonString = jsonString.substring(jsonStart, jsonEnd)
    }
    
    // Parse the response
    let analysisResult
    try {
      analysisResult = JSON.parse(jsonString)
      console.log('✅ Successfully parsed Llama 3.2 response')
    } catch (parseError) {
      console.warn('⚠️ JSON parsing failed, creating fallback analysis')
      console.log('Raw response:', llamaResponse)
      
      // Create intelligent fallback based on response content
      analysisResult = createFallbackAnalysis(llamaResponse, messages)
    }
    
    // Convert to our interface format with validation
    const insights: ConversationInsights = {
      overall_sentiment: analysisResult.overall_sentiment || 'neutral',
      business_probability: Math.min(100, Math.max(0, analysisResult.business_probability || 50)),
      revision_likelihood: Math.min(100, Math.max(0, analysisResult.revision_likelihood || 30)),
      conversation_summary: analysisResult.conversation_summary || 'Conversation analyzed by Llama 3.2',
      next_follow_up_timing: analysisResult.next_follow_up_timing || 'tomorrow',
      recommended_tasks: (analysisResult.recommended_tasks || []).map((task: any) => ({
        task_type: task.task_type || 'follow_up',
        title: task.title || 'Follow up with client',
        description: task.description || 'Continue conversation with client',
        priority: task.priority || 'medium',
        due_date: new Date(Date.now() + (task.due_hours || 24) * 60 * 60 * 1000).toISOString(),
        ai_reasoning: task.ai_reasoning || 'Recommended by AI analysis'
      }))
    }
    
    // Ensure at least one task is created
    if (insights.recommended_tasks.length === 0) {
      insights.recommended_tasks.push({
        task_type: 'follow_up',
        title: 'Follow up on quotation',
        description: 'Check client interest and address any concerns',
        priority: 'medium',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ai_reasoning: 'Default follow-up task created by AI system'
      })
    }
    
    console.log('🧠 Llama 3.2 Analysis Result:', {
      sentiment: insights.overall_sentiment,
      probability: insights.business_probability,
      tasks: insights.recommended_tasks.length
    })
    
    return insights
    
  } catch (error) {
    console.error('Error in Llama 3.2 analysis:', error)
    throw error
  }
}

/**
 * Create fallback analysis when JSON parsing fails
 */
function createFallbackAnalysis(rawResponse: string, messages: WhatsAppMessage[]): any {
  const response = rawResponse.toLowerCase()
  
  // Simple sentiment analysis based on keywords
  let sentiment = 'neutral'
  if (response.includes('positive') || response.includes('interested') || response.includes('good')) {
    sentiment = 'positive'
  } else if (response.includes('negative') || response.includes('concerned') || response.includes('issue')) {
    sentiment = 'negative'
  }
  
  // Check for urgency indicators
  const isUrgent = response.includes('urgent') || response.includes('immediate') || 
                   messages.some(msg => msg.message_text.toLowerCase().includes('urgent'))
  
  return {
    overall_sentiment: sentiment,
    business_probability: sentiment === 'positive' ? 70 : sentiment === 'negative' ? 30 : 50,
    revision_likelihood: response.includes('revision') || response.includes('change') ? 60 : 25,
    conversation_summary: `Analysis completed by Llama 3.2. ${messages.length} messages analyzed.`,
    key_insights: ['Fallback analysis performed', 'Manual review recommended'],
    client_concerns: [],
    recommended_tasks: [{
      task_type: isUrgent ? 'urgent_call' : 'follow_up',
      title: isUrgent ? 'Urgent follow-up required' : 'Regular follow-up',
      description: 'Continue conversation based on AI analysis',
      priority: isUrgent ? 'high' : 'medium',
      due_hours: isUrgent ? 2 : 24,
      ai_reasoning: 'Task created from fallback analysis'
    }],
    next_follow_up_timing: isUrgent ? 'immediate' : 'tomorrow'
  }
}

/**
 * Store individual message analysis results
 */
async function storeAnalysisResults(
  quotationId: number, 
  messages: WhatsAppMessage[], 
  insights: ConversationInsights
) {
  try {
    // Store conversation session summary
    await query(
      `INSERT INTO conversation_sessions (
        quotation_id, client_phone, session_start, session_end, 
        message_count, overall_sentiment, ai_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (quotation_id) 
       DO UPDATE SET 
         session_end = EXCLUDED.session_end,
         message_count = EXCLUDED.message_count,
         overall_sentiment = EXCLUDED.overall_sentiment,
         ai_summary = EXCLUDED.ai_summary`,
      [
        quotationId,
        messages[0]?.client_phone,
        messages[0]?.timestamp,
        messages[messages.length - 1]?.timestamp,
        messages.length,
        insights.overall_sentiment,
        insights.conversation_summary
      ]
    )
    
    // Update business lifecycle
    await query(
      `INSERT INTO quotation_business_lifecycle (
        quotation_id, probability_score, last_client_interaction, ai_insights
      ) VALUES ($1, $2, $3, $4)
       ON CONFLICT (quotation_id) 
       DO UPDATE SET 
         probability_score = EXCLUDED.probability_score,
         last_client_interaction = EXCLUDED.last_client_interaction,
         ai_insights = EXCLUDED.ai_insights`,
      [
        quotationId,
        insights.business_probability,
        messages[messages.length - 1]?.timestamp,
        JSON.stringify({
          revision_likelihood: insights.revision_likelihood,
          key_insights: insights.conversation_summary,
          next_action: insights.next_follow_up_timing
        })
      ]
    )
    
    // Mark messages as analyzed
    await query(
      "UPDATE whatsapp_messages SET ai_analyzed = true WHERE quotation_id = $1",
      [quotationId]
    )
    
    console.log('✅ Analysis results stored successfully')
    
  } catch (error) {
    console.error('Error storing analysis results:', error)
    throw error
  }
}

/**
 * Create AI-recommended tasks
 */
async function createAITasks(quotationId: number, insights: ConversationInsights) {
  try {
    // Get quotation owner for task assignment
    const quotationResult = await query(
      "SELECT created_by FROM quotations WHERE id = $1",
      [quotationId]
    )
    
    if (!quotationResult.rows || quotationResult.rows.length === 0) {
      throw new Error('Quotation not found for task creation')
    }
    
    const quotation = quotationResult.rows[0]
    
    // Create tasks from AI recommendations
    const tasks = insights.recommended_tasks
    
    if (tasks.length > 0) {
      const insertQuery = `
        INSERT INTO ai_communication_tasks (
          quotation_id, task_type, title, description, priority, 
          assigned_to_employee_id, due_date, ai_reasoning, status, created_by_ai
        ) VALUES ${tasks.map((_, i) => `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`).join(', ')}
      `
      
      const values: any[] = []
      tasks.forEach(task => {
        values.push(
          quotationId,
          task.task_type,
          task.title,
          task.description,
          task.priority,
          quotation.created_by,
          task.due_date,
          task.ai_reasoning,
          'pending',
          true
        )
      })
      
      await query(insertQuery, values)
      
      console.log(`✅ Created ${tasks.length} AI-recommended tasks`)
    }
    
  } catch (error) {
    console.error('Error creating AI tasks:', error)
    throw error
  }
}

/**
 * Process incoming WhatsApp message (webhook handler)
 */
export async function processIncomingWhatsAppMessage(messageData: {
  phone: string
  message: string
  timestamp: string
  messageId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`📱 Processing incoming WhatsApp message from ${messageData.phone}: "${messageData.message}"`)
    
    // Find quotation by phone number (any status, not just approved)
    const quotationResult = await query(
      `SELECT id, quotation_number, status 
       FROM quotations 
       WHERE mobile ILIKE $1 OR whatsapp ILIKE $1
       ORDER BY created_at DESC 
       LIMIT 1`,
      [`%${messageData.phone}%`]
    )
    
    let quotationId = quotationResult.rows[0]?.id || null
    
    // Store the incoming message
    await query(
      `INSERT INTO whatsapp_messages (
        quotation_id, client_phone, message_text, message_type, 
        timestamp, interakt_message_id, ai_analyzed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        quotationId,
        messageData.phone,
        messageData.message,
        'incoming',
        messageData.timestamp,
        messageData.messageId,
        false
      ]
    )
    
    console.log(`✅ Incoming message stored. Quotation ID: ${quotationId}`)
    
    // **GENERATE AI RESPONSE USING COMPREHENSIVE SYSTEM**
    console.log('🧠 Generating AI response using comprehensive system...')
    
    try {
      // Import the comprehensive AI function
      const { generateComprehensiveAIResponse } = await import('@/lib/comprehensive-business-ai')
      
      // Generate response using comprehensive AI
      const aiResult = await generateComprehensiveAIResponse(messageData.phone, messageData.message)
      
      console.log(`🤖 AI Response generated: "${aiResult.response}"`)
      console.log(`📊 Confidence: ${aiResult.confidence}, Sources: ${aiResult.data_sources.join(', ')}`)
      
      // Store the AI response as outgoing message
      await query(
        `INSERT INTO whatsapp_messages (
          quotation_id, client_phone, message_text, message_type, 
          timestamp, ai_analyzed
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          quotationId,
          messageData.phone,
          aiResult.response,
          'outgoing',
          new Date().toISOString(),
          true
        ]
      )
      
      console.log('✅ AI response stored successfully')
      
      // TODO: Send response back to client via WhatsApp API
      // This would integrate with your WhatsApp provider (Interakt, etc.)
      console.log('📤 Response ready to send to client (WhatsApp API integration needed)')
      
    } catch (aiError: any) {
      console.error('❌ AI response generation failed:', aiError.message)
      
      // Store a fallback response
      const fallbackResponse = "Thank you for your message. We'll get back to you shortly."
      
      await query(
        `INSERT INTO whatsapp_messages (
          quotation_id, client_phone, message_text, message_type, 
          timestamp, ai_analyzed
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          quotationId,
          messageData.phone,
          fallbackResponse,
          'outgoing',
          new Date().toISOString(),
          true
        ]
      )
      
      console.log('📤 Fallback response stored')
    }
    
    // Trigger background AI analysis for insights
    if (quotationId) {
      setTimeout(() => {
        analyzeClientCommunication(quotationId).catch(console.error)
      }, 2000)
    }
    
    return { success: true }
    
  } catch (error: any) {
    console.error('Error processing WhatsApp message:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get AI insights for a quotation
 */
export async function getQuotationInsights(quotationId: number): Promise<{
  success: boolean
  insights?: any
  error?: string
}> {
  try {
    const [messagesResult, sessionResult, lifecycleResult, tasksResult] = await Promise.all([
      query(
        `SELECT * FROM whatsapp_messages 
         WHERE quotation_id = $1 
         ORDER BY timestamp DESC`,
        [quotationId]
      ),
      
      query(
        `SELECT * FROM conversation_sessions 
         WHERE quotation_id = $1 
         ORDER BY session_start DESC`,
        [quotationId]
      ),
      
      query(
        "SELECT * FROM quotation_business_lifecycle WHERE quotation_id = $1",
        [quotationId]
      ),
      
      query(
        `SELECT * FROM ai_communication_tasks 
         WHERE quotation_id = $1 
         ORDER BY created_at DESC`,
        [quotationId]
      )
    ])
    
    return {
      success: true,
      insights: {
        messages: messagesResult.rows || [],
        sessions: sessionResult.rows || [],
        lifecycle: lifecycleResult.rows[0],
        ai_tasks: tasksResult.rows || []
      }
    }
    
  } catch (error: any) {
    console.error('Error getting quotation insights:', error)
    return { success: false, error: error.message }
  }
} 