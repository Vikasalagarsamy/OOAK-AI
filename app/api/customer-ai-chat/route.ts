import { NextRequest, NextResponse } from 'next/server'
import { LocalLLMService, getLLMConfigFromEnv, LLMConfigBuilder } from '@/services/local-llm-service'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

interface CustomerAIRequest {
  message: string
  customer_id?: string
  customer_name?: string
  context_type?: 'support' | 'sales' | 'editor' | 'general'
  session_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, customer_id, customer_name, context_type = 'general', session_id }: CustomerAIRequest = await request.json()
    
    console.log(`🤖 Customer AI (${context_type}): "${message}" from ${customer_name || 'Guest'}`)
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get LLM config
    let llmConfig = getLLMConfigFromEnv()
    if (!llmConfig) {
      llmConfig = LLMConfigBuilder.ollama('llama3.1:8b')
    }
    
    const llmService = new LocalLLMService(llmConfig)

    // Get customer context (limited information only)
    const customerContext = await getCustomerContext(customer_id, customer_name)

    // Build customer-facing AI personality based on context type
    const systemPrompt = buildCustomerSystemPrompt(context_type, customerContext, message)
    
    console.log('🤖 Customer AI: Processing customer query...')
    const response = await llmService.generateIntelligentResponse(systemPrompt)
    
    // Log customer interaction for analysis
    await logCustomerInteraction(customer_id, customer_name, message, response, context_type, session_id)
    
    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
      status: "success",
      ai_type: "customer_facing",
      context: context_type
    })

  } catch (error) {
    console.error('❌ Customer AI Chat Error:', error)
    return NextResponse.json(
      { error: 'I apologize, but I\'m having technical difficulties. Please try again in a moment or contact our support team directly.' },
      { status: 500 }
    )
  }
}

async function getCustomerContext(customer_id?: string, customer_name?: string) {
  if (!customer_id && !customer_name) return null

  const client = await pool.connect()
  try {
    console.log('🔍 Fetching customer context for:', { customer_id, customer_name })
    
    // Get limited customer information (no sensitive business data)
    let query: string
    let params: any[]
    
    if (customer_id) {
      query = `
        SELECT id, client_name, total_amount, status, created_at 
        FROM quotations 
        WHERE id = $1
        ORDER BY created_at DESC 
        LIMIT 3
      `
      params = [customer_id]
    } else {
      query = `
        SELECT id, client_name, total_amount, status, created_at 
        FROM quotations 
        WHERE client_name ILIKE $1
        ORDER BY created_at DESC 
        LIMIT 3
      `
      params = [`%${customer_name}%`]
    }

    const result = await client.query(query, params)
    const quotations = result.rows

    console.log(`✅ Found ${quotations.length} quotations for customer`)

    return {
      hasQuotations: quotations && quotations.length > 0,
      quotationCount: quotations?.length || 0,
      latestQuotation: quotations?.[0] || null
    }
  } catch (error) {
    console.error('❌ Error fetching customer context:', error)
    return null
  } finally {
    client.release()
  }
}

function buildCustomerSystemPrompt(contextType: string, customerContext: any, userMessage: string): string {
  const basePersonality = `You are a professional AI assistant representing Vikas's creative photography business. You provide helpful, courteous, and accurate information to customers.

CORE GUIDELINES:
- Be professional, friendly, and helpful
- Never share internal business data, financial details, or team information
- Focus on customer service and satisfaction
- If you don't know something, offer to connect them with a human representative
- Always maintain customer confidentiality
- Speak in a warm, professional tone`

  const contextSpecificRoles = {
    support: `
CUSTOMER SUPPORT ROLE:
- Help customers with inquiries about their orders, quotations, and services
- Provide information about photography packages and pricing
- Assist with scheduling and booking questions  
- Handle complaints with empathy and professionalism
- Escalate complex issues to human support when needed
- Focus on problem-solving and customer satisfaction`,

    sales: `
SALES REPRESENTATIVE ROLE:
- Present photography services and packages professionally
- Understand customer needs and suggest appropriate solutions
- Provide general pricing information (not specific internal costs)
- Help customers understand the value of professional photography
- Guide customers through the inquiry and booking process
- Be persuasive but never pushy - focus on customer benefits`,

    editor: `
CONTENT EDITOR ROLE:
- Review and improve customer communications
- Ensure all written content is professional and error-free
- Maintain brand voice and consistency
- Suggest improvements for clarity and impact
- Focus on effective communication
- Respect customer's original intent while enhancing presentation`,

    general: `
GENERAL ASSISTANT ROLE:
- Provide helpful information about the business and services
- Answer common questions about photography services
- Direct customers to appropriate resources or contacts
- Maintain professional and friendly communication
- Assist with general inquiries and information requests`
  }

  const customerInfo = customerContext ? `
CUSTOMER CONTEXT:
- Customer has ${customerContext.quotationCount} previous interactions with us
- ${customerContext.hasQuotations ? 'Existing customer with quotation history' : 'New potential customer'}
- Latest interaction: ${customerContext.latestQuotation ? new Date(customerContext.latestQuotation.created_at).toLocaleDateString() : 'First time visitor'}` : `
CUSTOMER CONTEXT:
- New visitor to our services
- Provide general information and assistance`

  return `${basePersonality}

${contextSpecificRoles[contextType as keyof typeof contextSpecificRoles] || contextSpecificRoles.general}

${customerInfo}

CURRENT CUSTOMER MESSAGE: "${userMessage}"

Respond professionally and helpfully. Focus on excellent customer service while maintaining appropriate boundaries.`
}

async function logCustomerInteraction(
  customer_id?: string, 
  customer_name?: string, 
  message?: string, 
  response?: string, 
  context_type?: string, 
  session_id?: string
) {
  const client = await pool.connect()
  try {
    console.log('📝 Logging customer interaction:', { customer_name, context_type })
    
    // Check if customer_ai_interactions table exists, create if it doesn't
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_ai_interactions'
      );
    `
    
    const tableExists = await client.query(checkTableQuery)
    
    if (!tableExists.rows[0].exists) {
      console.log('🏗️ Creating customer_ai_interactions table...')
      const createTableQuery = `
        CREATE TABLE customer_ai_interactions (
          id SERIAL PRIMARY KEY,
          customer_id VARCHAR(255),
          customer_name VARCHAR(255),
          customer_message TEXT,
          ai_response TEXT,
          context_type VARCHAR(50),
          session_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
      await client.query(createTableQuery)
      console.log('✅ customer_ai_interactions table created')
    }
    
    const insertQuery = `
      INSERT INTO customer_ai_interactions (
        customer_id, customer_name, customer_message, ai_response, 
        context_type, session_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    `
    
    await client.query(insertQuery, [
      customer_id, customer_name, message, response, context_type, session_id
    ])
    
    console.log('✅ Customer interaction logged successfully')
  } catch (error) {
    console.error('❌ Error logging customer interaction:', error)
    // Don't throw - logging failure shouldn't break customer experience
  } finally {
    client.release()
  }
}

// Health check for customer AI
export async function GET() {
  const client = await pool.connect()
  try {
    // Test PostgreSQL connection
    const result = await client.query('SELECT NOW() as timestamp, version() as pg_version')
    const dbInfo = result.rows[0]
    
    // Check customer interactions table
    const interactionsCount = await client.query('SELECT COUNT(*) as count FROM customer_ai_interactions')
    const totalInteractions = interactionsCount.rows[0]?.count || 0
    
    return NextResponse.json({
      status: "✅ Customer AI Ready",
      available_contexts: ["support", "sales", "editor", "general"],
      security: "Customer-safe (no internal data exposure)",
      database: {
        status: "connected",
        timestamp: dbInfo.timestamp,
        version: dbInfo.pg_version,
        total_interactions: totalInteractions
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Customer AI health check failed:', error)
    return NextResponse.json({
      status: "❌ Customer AI Error",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    client.release()
  }
} 