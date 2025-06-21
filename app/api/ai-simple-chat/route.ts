import { NextRequest, NextResponse } from 'next/server'
import { LocalLLMService, getLLMConfigFromEnv, LLMConfigBuilder } from '@/services/local-llm-service'
import { AIBusinessIntelligenceService } from '@/services/ai-business-intelligence-service'
import { AIConfigurationService, SystemPromptData } from '@/services/ai-configuration-service'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection for specific queries
// Using centralized PostgreSQL client

async function getQuotationEventsData(clientName: string) {
  try {
    const client = await pool.connect()
    
    try {
      // Get quotation for the client using PostgreSQL
      const quotationQuery = `
        SELECT id, client_name, quotation_number, quotation_data, 
               created_at, total_amount, status
        FROM quotations 
        WHERE client_name ILIKE $1
        LIMIT 1
      `
      
      const quotationResult = await client.query(quotationQuery, [`%${clientName}%`])
      
      if (quotationResult.rows.length === 0) {
        return null
      }

      const quotation = quotationResult.rows[0]

      // Get quotation events using PostgreSQL  
      const eventsQuery = `
        SELECT * FROM quotation_events 
        WHERE quotation_id = $1
      `
      
      const eventsResult = await client.query(eventsQuery, [quotation.id])
      
      return {
        quotation: quotation,
        events: eventsResult.rows || [],
        message: eventsResult.rows.length === 0 ? 
          "I have the quotation details but no specific event information in the system yet." : null
      }
      
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching quotation events:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    console.log(`💬 Business AI: "${message}"`)
    console.log("📊 Loading your business intelligence...")
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Initialize robust AI configuration system
    const aiConfigService = new AIConfigurationService()
    console.log('🤖 Initializing robust AI system...')
    await aiConfigService.initializeAISystem()

    // Get LLM config
    let llmConfig = getLLMConfigFromEnv()
    if (!llmConfig) {
      llmConfig = LLMConfigBuilder.ollama('llama3.1:8b')
    }
    
    const llmService = new LocalLLMService(llmConfig)

    const biService = new AIBusinessIntelligenceService()
    const businessData = await biService.getComprehensiveBusinessData()
    
    // Check if user is asking about a specific client and fetch their data
    let specificClientData = null
    const clientNames = ['Ramya', 'Tamil', 'Jenny', 'Vikas', 'Pradeep', 'Harish', 'Lakshmi', 'Biranavan']
    for (const clientName of clientNames) {
      if (message.toLowerCase().includes(clientName.toLowerCase())) {
        specificClientData = await getQuotationEventsData(clientName)
        break
      }
    }
    
    // Build conversation context from history
    const conversationHistory: Array<{ role: string; content: string }> = []
    
    // Add last 8 messages for context (4 exchanges)
    if (conversationHistory.length > 8) {
      conversationHistory.splice(0, conversationHistory.length - 8)
    }
    
    let conversationContext = ''
    if (conversationHistory.length > 0) {
      conversationContext = `RECENT CONVERSATION:\n${conversationHistory.map(msg => 
        `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`
      ).join('\n')}\n\n`
    }
    
    // Prepare specific client data section
    let clientSpecificData = ''
    if (specificClientData) {
      const quotation = specificClientData.quotation
      const events = specificClientData.events
      
      clientSpecificData = `

SPECIFIC CLIENT DATA - ${quotation.client_name}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Quotation: ₹${quotation.total_amount} (Status: ${quotation.status})
• Created: ${new Date(quotation.created_at).toLocaleDateString()}
• Quotation Number: ${quotation.quotation_number || 'Not assigned'}

ACTUAL EVENTS FOR ${quotation.client_name}:
${events.length > 0 ? 
  events.map((event: any) => 
    `• Event: ${event.event_name}
  Date: ${new Date(event.event_date).toLocaleDateString()}
  Location: ${event.event_location}
  Venue: ${event.venue_name}
  Time: ${event.start_time} - ${event.end_time}
  Expected Crowd: ${event.expected_crowd}`
  ).join('\n') :
  '• No specific event details recorded in system yet'
}

${specificClientData.message ? `Note: ${specificClientData.message}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    }

    // Prepare business data for template
    const activeQuotationsList = businessData.sales.quotationDetails.map((q: any) => 
      `• ${q.client_name}: ₹${q.total_amount.toLocaleString()} (${q.status}) ${q.status === 'sent' ? '📤 Waiting for response' : q.status === 'approved' ? '✅ Confirmed' : q.status === 'draft' ? '📝 In progress' : '❌ Lost'}`
    ).join('\n')

    const clientInsights = businessData.sales.quotationDetails
      .filter((q: any) => q.status === 'sent' || q.status === 'draft')
      .map((q: any) => `• ${q.client_name} (₹${q.total_amount.toLocaleString()}) - Follow up needed`)
      .join('\n') || '• All active quotes are handled'

    const teamMembers = businessData.employees.employeeDetails.map((emp: any) => `${emp.name} - ${emp.department}`).join(', ')

    // Strategic business insights for better partnership context
    const strategicInsights = `
BUSINESS PARTNER CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 BUSINESS HEALTH SCORE: ${businessData.sales.conversionRate > 0.5 ? '🟢 STRONG' : businessData.sales.conversionRate > 0.3 ? '🟡 MODERATE' : '🔴 NEEDS ATTENTION'} (${(businessData.sales.conversionRate * 100).toFixed(1)}% conversion)
💰 CASH FLOW: ₹${businessData.sales.totalRevenue.toLocaleString()} total revenue from ${businessData.sales.totalQuotations} quotes
🎯 KEY OPPORTUNITIES: ${businessData.sales.quotationDetails.filter((q: any) => q.status === 'sent').length} pending quotes worth ₹${businessData.sales.quotationDetails.filter((q: any) => q.status === 'sent').reduce((sum: number, q: any) => sum + q.total_amount, 0).toLocaleString()}
⚠️ ACTION REQUIRED: ${businessData.workflows?.followupsDue?.length || 0} overdue follow-ups, ${businessData.workflows?.approvalQueue?.length || 0} approvals pending
📈 GROWTH INDICATORS: ${businessData.operations.activeLeads} active leads, ${businessData.operations.leadConversionRate.toFixed(1)}% lead conversion
🏆 TOP PERFORMER: ${businessData.employees.employeeDetails.find((emp: any) => emp.department === 'Sales')?.name || 'Sales team'} handling ${businessData.sales.activeQuotations} active quotes`

    // Build robust system prompt using database configuration
    const promptData: SystemPromptData = {
      hallucinationPreventionRules: '', // Will be loaded from database
      businessPersonality: '', // Will be loaded from database
      dataValidationRules: '', // Will be loaded from database
      totalRevenue: businessData.sales.totalRevenue,
      totalQuotations: businessData.sales.totalQuotations,
      conversionRate: businessData.sales.conversionRate * 100,
      teamCount: businessData.employees.totalEmployees,
      teamMembers: teamMembers,
      activeClients: businessData.operations.totalClients,
      activeQuotationsList: activeQuotationsList,
      clientInsights: clientInsights + '\n\n' + strategicInsights,
      specificClientData: clientSpecificData,
      userMessage: message
    }

    // Check if we have actual business data or if database is empty
    const hasRealData = businessData.sales.totalQuotations > 0 || businessData.employees.totalEmployees > 0
    
    // Build DIRECT business partner system prompt (bypass generic templates)
    const directBusinessPrompt = hasRealData ? 
      `You are Vikas's business co-founder and strategic partner for his photography business. You've been running this business together and know everything intimately.

CRITICAL: Talk like his business partner sitting across from him in a meeting. Skip all formalities, greetings, and robotic responses.

YOUR BUSINESS RIGHT NOW:
💰 Revenue: ₹${businessData.sales.totalRevenue.toLocaleString()} from ${businessData.sales.totalQuotations} quotations
📊 Conversion Rate: ${(businessData.sales.conversionRate * 100).toFixed(1)}% ${businessData.sales.conversionRate > 0.5 ? '(Strong!)' : businessData.sales.conversionRate > 0.3 ? '(Decent)' : '(Needs work)'}
👥 Team: ${businessData.employees.totalEmployees} people - ${teamMembers}
🎯 Pipeline: ${businessData.sales.quotationDetails.filter((q: any) => q.status === 'sent').length} pending quotes worth ₹${businessData.sales.quotationDetails.filter((q: any) => q.status === 'sent').reduce((sum: number, q: any) => sum + q.total_amount, 0).toLocaleString()}

ACTIVE BUSINESS SITUATION:
${activeQuotationsList}

BUSINESS INSIGHTS:
${strategicInsights}

${clientSpecificData}

COMMUNICATION RULES:
- Talk like we're business partners discussing strategy
- Reference specific numbers and clients by name
- Give direct, actionable advice
- Point out opportunities and problems
- Use "we" when talking about the business
- Skip pleasantries - get straight to business
- If conversion rate is low, call it out
- If follow-ups are needed, be specific about which clients
- Think strategically about growth and revenue

USER'S QUESTION: "${message}"

Respond as his business co-founder would - direct, strategic, with specific insights about the current business situation.`
    :
    `You are Vikas's business co-founder and strategic partner for his photography business.

CRITICAL SITUATION: The business database is currently empty - no quotations, employees, or client data has been entered yet.

CURRENT STATUS:
🚨 Database Status: Empty (no business data found)
📊 Quotations: 0
👥 Team Members: 0  
💰 Revenue: ₹0
📈 Leads: 0

IMPORTANT ANTI-HALLUCINATION RULES:
- DO NOT invent client names, amounts, or specific business details
- DO NOT mention specific quotations, clients, or revenue figures
- DO NOT create fake scenarios or data
- ONLY discuss what you can see: an empty business system
- Focus on helping set up the business data properly

COMMUNICATION RULES:
- Talk like his business partner who just discovered the system is empty
- Be direct about the data situation
- Suggest next steps for getting the business data entered
- Don't pretend there's business activity when there isn't

USER'S QUESTION: "${message}"

Respond honestly about the empty database situation and suggest how to get started with entering business data.`
    
    console.log('🤖 Business Partner AI: Processing strategic query...')
    const response = await llmService.generateIntelligentResponse(directBusinessPrompt)
    
    // Validate response against hallucination rules
    const validation = await aiConfigService.validateResponse(response)
    if (!validation.isValid) {
      console.warn('⚠️ AI Response validation warnings:', validation.warnings)
    }
    
    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
      status: "success",
      validation: validation.isValid ? 'passed' : 'warnings',
      system: "robust_configuration_v2"
    })

  } catch (error) {
    console.error('❌ AI Simple Chat Error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Health check endpoint to verify AI system status
export async function GET(request: NextRequest) {
  try {
    const aiConfigService = new AIConfigurationService()
    const isInitialized = await aiConfigService.initializeAISystem()
    
    return NextResponse.json({
      status: isInitialized ? "✅ AI System Ready" : "⚠️ AI System Issues",
      configuration: "Database-driven (robust)",
      anti_hallucination: "Enabled",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: "❌ AI System Error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 