import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// Dynamic import for ES modules
let unifiedAIService: any = null

const getUnifiedAIService = async () => {
  if (!unifiedAIService) {
    const module = await import('../../../services/unified-ai-service.js')
    unifiedAIService = module.unifiedAIService
  }
  return unifiedAIService
}

export async function POST(request: NextRequest) {
  console.log('🌟 Universal AI Chat Query Received')
  
  try {
    const { message, userId } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    
    console.log(`🧠 Processing universal query: "${message}" for user: ${userId}`)

    // Get business data from existing tables
    const context = await getBusinessContext(message)
    
    console.log('📊 Context retrieved:', {
      leads: context.leads.length,
      quotations: context.quotations.length,
      tasks: context.tasks.length,
      employees: context.employees.length
    })

    // **USE THE SAME WORKING SYSTEM AS WHATSAPP**
    const { generateComprehensiveAIResponse } = await import('../../../lib/comprehensive-business-ai')
    
    // Process query with the WORKING comprehensive business AI
    const comprehensiveResult = await generateComprehensiveAIResponse(
      'dashboard_user',
      message,
      'customer_support'
    )
    
    const aiResponse = {
      response: comprehensiveResult.response,
      confidence: comprehensiveResult.confidence,
      sources: comprehensiveResult.data_sources,
      suggested_actions: ['Review business data', 'Follow up on leads'],
      model_used: 'Comprehensive Business AI',
      provider: 'vikas_style'
    }
    
    const processingTime = Date.now() - startTime

    console.log(`✅ Universal AI query processed in ${processingTime}ms`)
    console.log(`📈 Response confidence: ${aiResponse.confidence}`)
    console.log(`🤖 Model used: ${aiResponse.model_used}`)

    return NextResponse.json({
      success: true,
      response: aiResponse.response,
      confidence: aiResponse.confidence,
      sources: aiResponse.sources,
      context_used: {
        leads: context.leads.length,
        quotations: context.quotations.length,
        tasks: context.tasks.length,
        employees: context.employees.length,
        summary: `Retrieved ${context.leads.length} leads, ${context.quotations.length} quotations, ${context.tasks.length} tasks, and ${context.employees.length} employees`
      },
      suggested_actions: aiResponse.suggested_actions,
      processing_time_ms: processingTime,
      model_used: aiResponse.model_used,
      provider: aiResponse.provider,
      fallback_used: false,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Universal AI chat error:', error)
    
    return NextResponse.json({
      success: false,
      response: "I apologize, but I'm having trouble accessing the business data right now. Please try again in a moment.",
      confidence: 0.0,
      sources: [],
      context_used: { leads: 0, quotations: 0, tasks: 0, employees: 0 },
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🔍 Getting Universal AI system status...')
    
    // Get AI service status
    const aiService = await getUnifiedAIService()
    let aiStatus = null
    
    try {
      await aiService.initialize()
      aiStatus = aiService.getSystemStatus()
    } catch (error) {
      aiStatus = { error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Get PostgreSQL database status
    const client = await pool.connect()
    let dbStatus = null
    try {
      const result = await client.query('SELECT NOW() as timestamp, version() as pg_version')
      dbStatus = {
        connected: true,
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].pg_version
      }
    } catch (error) {
      dbStatus = { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    } finally {
      client.release()
    }

    return NextResponse.json({
      message: 'Universal Business Intelligence AI System',
      status: 'operational',
      database: dbStatus,
      ai_system: aiStatus,
      capabilities: [
        '🧠 Advanced AI Model Management',
        '🔄 Automatic Model Switching',
        '🚀 GPU Server Ready',
        '📊 Complete Business Intelligence',
        '💫 Real-time Response Generation',
        '🎯 Context-Aware Suggestions'
      ],
      available_models: aiStatus?.active_model ? [
        aiStatus.active_model,
        aiStatus.fallback_model
      ].filter(Boolean) : [],
      endpoints: {
        'POST /api/ai-universal-chat': 'Send business intelligence queries',
        'GET /api/ai-universal-chat': 'Get system status',
        'POST /api/ai-model-switch': 'Switch AI models (coming soon)'
      },
      example_queries: [
        'What are our current leads and their status?',
        'Show me recent quotations and their values',
        'What tasks are pending for our team?',
        'Who are our team members and their roles?',
        'What\'s our total business pipeline value?',
        'Which leads need follow-up?',
        'Show me high-value quotations',
        'What are the urgent tasks today?',
        'Analyze our business performance this month',
        'Who is handling the most leads?'
      ],
      migration_ready: {
        gpu_server_support: true,
        model_switching: true,
        fallback_system: true,
        zero_downtime_migration: true,
        postgresql_integrated: true
      }
    })

  } catch (error) {
    console.error('❌ Error getting Universal AI status:', error)
    
    return NextResponse.json({
      message: 'Universal Business Intelligence AI',
      status: 'Error retrieving status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper functions for business context
async function getBusinessContext(message: string) {
  const client = await pool.connect()
  
  console.log('🔍 Fetching business context from PostgreSQL...')
  
  const context = {
    leads: [] as any[],
    quotations: [] as any[],
    tasks: [] as any[],
    employees: [] as any[]
  }

  try {
    // Fetch leads with PostgreSQL
    const leadsQuery = `
      SELECT l.*, e.name as assigned_to_name
      FROM leads l
      LEFT JOIN employees e ON l.assigned_to::text = e.id::text
      ORDER BY l.created_at DESC 
      LIMIT 20
    `
    const leadsResult = await client.query(leadsQuery)
    context.leads = leadsResult.rows
    console.log(`📋 Retrieved ${context.leads.length} leads`)

    // Fetch quotations with PostgreSQL
    const quotationsQuery = `
      SELECT q.*, e.name as created_by_name
      FROM quotations q
      LEFT JOIN employees e ON q.created_by = e.id
      ORDER BY q.created_at DESC 
      LIMIT 20
    `
    const quotationsResult = await client.query(quotationsQuery)
    context.quotations = quotationsResult.rows
    console.log(`💰 Retrieved ${context.quotations.length} quotations`)

    // Fetch tasks with PostgreSQL
    const tasksQuery = `
      SELECT t.*, e.name as employee_name
      FROM tasks t
      LEFT JOIN employees e ON t.employee_id = e.id
      ORDER BY t.created_at DESC 
      LIMIT 20
    `
    const tasksResult = await client.query(tasksQuery)
    context.tasks = tasksResult.rows
    console.log(`✅ Retrieved ${context.tasks.length} tasks`)

    // Fetch employees with PostgreSQL
    const employeesQuery = `
      SELECT e.*, d.name as department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status = 'active'
      ORDER BY e.name
      LIMIT 50
    `
    const employeesResult = await client.query(employeesQuery)
    context.employees = employeesResult.rows
    console.log(`👥 Retrieved ${context.employees.length} employees`)

  } catch (error) {
    console.error('❌ Error fetching business context:', error)
  } finally {
    client.release()
  }

  return context
}

function buildBusinessPrompt(message: string, context: any): string {
  const { leads, quotations, tasks, employees } = context
  
  return `You are Vikas from OOAK Photography. Respond EXACTLY like your real conversation style:

## YOUR COMMUNICATION DNA:
- **Response Length**: 7 words average (37% short, 59% medium, 4% long)
- **Style**: Professional but friendly photography expert
- **Top Words**: will, you, your, link, well, thank, shared, video, please, share

## RESPONSE RULES - SOUND EXACTLY LIKE REAL VIKAS:
1. **KEEP RESPONSES SHORT**: Most responses 6-15 words
2. **USE YOUR EXACT WORDS**: will, you, your, link, well, thank, shared, video, please, share
3. **BE DIRECT**: No fluff, get straight to the point
4. **PROFESSIONAL TONE**: Business-focused but friendly
5. **ACTION-ORIENTED**: Always mention what you "will" do next

## YOUR SIGNATURE RESPONSES:
- "Got it. Will update."
- "Thank you for sharing your details."
- "Will share updates."
- "It's under progress. Will share by next week."
- "Thank you. Changes noted."

## NEVER DO THESE (Unlike typical AI):
❌ Don't say: "I hope you're having a great day!"
❌ Don't say: "I'm excited to work with you!"
❌ Don't say: "Let me know if you have any other questions!"
❌ Don't use excessive enthusiasm or marketing language

## ALWAYS DO THESE (Like real Vikas):
✅ Start with action: "Will share..." / "Got it..." / "Thank you..."
✅ Include timeline when relevant: "by next week" / "in 2 days" / "shortly"
✅ Use your signature phrases: "Changes noted" / "Will update" / "Thank you for sharing"
✅ Keep it business-focused and efficient

CURRENT BUSINESS DATA:
===================

LEADS (${leads.length} total):
${leads.slice(0, 5).map((lead: any) => 
  `• ${lead.name || 'Unnamed'} - ${lead.service || 'No service'} - Status: ${lead.status || 'Unknown'}`
).join('\n')}

QUOTATIONS (${quotations.length} total):
${quotations.slice(0, 5).map((quote: any) => 
  `• ${quote.client_name || 'Unknown client'} - ₹${quote.total_amount || 0} - Status: ${quote.status || 'Unknown'}`
).join('\n')}

TASKS (${tasks.length} total):
${tasks.slice(0, 5).map((task: any) => 
  `• ${task.title || 'Untitled'} - Priority: ${task.priority || 'Normal'} - Status: ${task.status || 'Unknown'}`
).join('\n')}

TEAM MEMBERS (${employees.length} total):
${employees.map((emp: any) => 
  `• ${emp.name || 'Unnamed'} - ${emp.role || 'No role'}`
).join('\n')}

USER QUESTION: "${message}"

RESPOND EXACTLY LIKE THE REAL VIKAS - SHORT, DIRECT, ACTION-ORIENTED. Use your exact words and communication patterns from the real conversations.`
}

// Working Ollama integration function
async function processBusinessQueryWithOllama(prompt: string, context: any) {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 2000
        }
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.response || 'No response generated'

    return {
      response: responseText,
      model_used: 'Local Ollama (llama3.1:8b)',
      provider: 'ollama',
      confidence: calculateBusinessConfidence(context, responseText),
      sources: extractBusinessSources(context),
      suggested_actions: generateBusinessActions(context, responseText)
    }

  } catch (error) {
    console.error('❌ Ollama processing error:', error)
    return {
      response: "I apologize, but I'm having trouble processing your request. Please try again in a moment.",
      model_used: "error_fallback",
      provider: "none",
      confidence: 0.0,
      sources: [],
      suggested_actions: ["Check AI service status", "Try again in a few moments"]
    }
  }
}

function calculateBusinessConfidence(context: any, response: string): number {
  let confidence = 0.4 // Base confidence

  // More data = higher confidence
  if (context.leads.length > 0) confidence += 0.2
  if (context.quotations.length > 0) confidence += 0.2
  if (context.tasks.length > 0) confidence += 0.1
  if (context.employees.length > 0) confidence += 0.1

  // Detailed response adds confidence
  if (response.length > 300) confidence += 0.1

  return Math.min(confidence, 1.0)
}

function extractBusinessSources(context: any): string[] {
  const sources = []
  
  if (context.leads.length > 0) sources.push('leads_database')
  if (context.quotations.length > 0) sources.push('quotations_database')
  if (context.tasks.length > 0) sources.push('tasks_database')
  if (context.employees.length > 0) sources.push('employees_database')
  
  return sources
}

function generateBusinessActions(context: any, response: string): string[] {
  const actions = []
  
  // Analyze business data for suggested actions
  if (context.leads.some((l: any) => l.status === 'assigned')) {
    actions.push('Follow up with assigned leads')
  }
  
  if (context.quotations.some((q: any) => q.status === 'pending')) {
    actions.push('Review pending quotations')
  }
  
  if (context.tasks.some((t: any) => t.status === 'pending' && t.priority === 'high')) {
    actions.push('Complete high-priority tasks')
  }
  
  if (context.quotations.length > 0) {
    const totalValue = context.quotations.reduce((sum: number, q: any) => sum + (q.total_amount || 0), 0)
    if (totalValue > 100000) {
      actions.push('Focus on high-value quotation conversions')
    }
  }
  
  return actions
} 