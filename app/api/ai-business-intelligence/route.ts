import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// **EMERGENCY SAFETY PROTOCOL**
const AI_EMERGENCY_FLAG = '/tmp/ai-emergency-disconnect'

// **RATE LIMITING & SECURITY**
const RATE_LIMIT_PER_MINUTE = 10
const rateLimitStore = new Map<string, { count: number, resetTime: number }>()

// **AUTHENTICATION & RATE LIMITING**
function authenticateAndRateLimit(request: NextRequest): { 
  authenticated: boolean, 
  rateLimited: boolean, 
  errorMessage?: string,
  userRole?: string 
} {
  // Check for AI secret token
  const authHeader = request.headers.get('authorization')
  const aiSecret = process.env.AI_SECRET_TOKEN || 'ai-secret-2024'
  
  if (!authHeader || !authHeader.includes(aiSecret)) {
    return { 
      authenticated: false, 
      rateLimited: false, 
      errorMessage: 'Missing or invalid AI secret token' 
    }
  }
  
  // Rate limiting by IP
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const rateKey = `rate_${clientIp}`
  
  const currentRate = rateLimitStore.get(rateKey)
  if (currentRate) {
    if (now < currentRate.resetTime) {
      if (currentRate.count >= RATE_LIMIT_PER_MINUTE) {
        return { 
          authenticated: true, 
          rateLimited: true, 
          errorMessage: 'Rate limit exceeded. Please wait.' 
        }
      }
      currentRate.count++
    } else {
      rateLimitStore.set(rateKey, { count: 1, resetTime: now + 60000 })
    }
  } else {
    rateLimitStore.set(rateKey, { count: 1, resetTime: now + 60000 })
  }
  
  // Determine user role (simplified for PostgreSQL)
  const userRole = authHeader.includes('admin') ? 'admin' : 'authenticated'
  
  return { authenticated: true, rateLimited: false, userRole }
}

// Audit Logging
function logAIAccess(userRole: string, query: string, clientIp: string) {
  const timestamp = new Date().toISOString()
  console.log(`🔒 AI ACCESS LOG [${timestamp}] Role: ${userRole} | IP: ${clientIp} | Query: ${query.substring(0, 100)}...`)
}

// **SECURED BUSINESS DATA READER**
async function getSecuredBusinessData(userRole: string) {
  console.log(`🔍 AI READING BUSINESS DATA [Role: ${userRole}]...`)
  
  const businessData: any = {
    whatsapp_messages: [],
    leads: [],
    quotations: [],
    tasks: [],
    employees: []
  }
  
  const client = await pool.connect()
  try {
    // WhatsApp Messages (Authenticated users only)
    if (userRole === 'authenticated' || userRole === 'admin') {
      const whatsappQuery = `
        SELECT id, from_phone, content, timestamp, message_type
        FROM whatsapp_messages 
        ORDER BY timestamp DESC 
        LIMIT 50
      `
      const whatsappResult = await client.query(whatsappQuery)
      
      if (whatsappResult.rows.length > 0) {
        businessData.whatsapp_messages = whatsappResult.rows.map(msg => ({
          ...msg,
          content: userRole === 'admin' ? msg.content : msg.content.substring(0, 100) + '...' // Truncate for non-admin
        }))
      }
    }
    
    // Leads Data (Admin only for sensitive info)
    if (userRole === 'admin') {
      const leadsQuery = `
        SELECT l.id, l.name, l.email, l.mobile, l.status, l.source, l.created_at,
               e.name as assigned_to_name
        FROM leads l
        LEFT JOIN employees e ON l.assigned_to::text = e.id::text
        ORDER BY l.created_at DESC 
        LIMIT 20
      `
      const leadsResult = await client.query(leadsQuery)
      
      if (leadsResult.rows.length > 0) {
        businessData.leads = leadsResult.rows
      }
    }
    
    // Quotations (Admin only for sensitive financial data)
    if (userRole === 'admin') {
      const quotationsQuery = `
        SELECT q.id, q.quotation_number, q.client_name, q.total_amount, 
               q.status, q.created_at, e.name as created_by_name
        FROM quotations q
        LEFT JOIN employees e ON q.created_by = e.id
        ORDER BY q.created_at DESC 
        LIMIT 15
      `
      const quotationsResult = await client.query(quotationsQuery)
      
      if (quotationsResult.rows.length > 0) {
        businessData.quotations = quotationsResult.rows
      }
    }
    
    // Basic Analytics (All authenticated users)
    if (userRole === 'authenticated' || userRole === 'admin') {
      const tasksQuery = `
        SELECT t.id, t.title, t.status, t.priority, t.due_date,
               e.name as employee_name
        FROM tasks t
        LEFT JOIN employees e ON t.employee_id = e.id
        ORDER BY t.created_at DESC 
        LIMIT 10
      `
      const tasksResult = await client.query(tasksQuery)
      
      if (tasksResult.rows.length > 0) {
        businessData.tasks = tasksResult.rows
      }
      
      // Employee data (basic info only)
      const employeesQuery = `
        SELECT e.id, e.name, e.role, d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.status = 'active'
        ORDER BY e.name
        LIMIT 20
      `
      const employeesResult = await client.query(employeesQuery)
      
      if (employeesResult.rows.length > 0) {
        businessData.employees = employeesResult.rows
      }
    }
    
    console.log(`✅ Secured data loaded for ${userRole}: ${businessData.whatsapp_messages.length} messages, ${businessData.leads.length} leads, ${businessData.quotations.length} quotations, ${businessData.tasks.length} tasks, ${businessData.employees.length} employees`)
    
  } catch (error) {
    console.error('❌ Error loading secured business data:', error)
  } finally {
    client.release()
  }
  
  return businessData
}

export async function POST(request: NextRequest) {
  try {
    // **STEP 0: EMERGENCY DISCONNECT CHECK**
    if (existsSync(AI_EMERGENCY_FLAG)) {
      return NextResponse.json({
        success: true,
        ai_response: "🚨 AI is currently in SAFE MODE. The AI Brain is running but disconnected from business data for safety. All your business operations (WhatsApp, calls, website) continue to work normally. To reconnect AI, use the Emergency Recovery button on your control dashboard.",
        status: 'SAFE_MODE_ACTIVE',
        emergency: true,
        message: 'AI disconnected from business data by emergency protocol',
        timestamp: new Date().toISOString()
      })
    }
    
    // **STEP 1: AUTHENTICATION & RATE LIMITING**
    const security = authenticateAndRateLimit(request)
    
    if (!security.authenticated || security.rateLimited) {
      return NextResponse.json({
        success: false,
        error: security.errorMessage,
        security_level: 'PROTECTED',
        timestamp: new Date().toISOString()
      }, { 
        status: security.authenticated ? 429 : 401,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_PER_MINUTE.toString(),
          'X-RateLimit-Remaining': '0'
        }
      })
    }
    
    const { message } = await request.json()
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    
    // **STEP 2: AUDIT LOGGING**
    logAIAccess(security.userRole!, message, clientIp)
    
    // **STEP 3: VALIDATE INPUT**
    if (!message || message.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'Invalid message. Must be 1-500 characters.',
        security_level: 'VALIDATED'
      }, { status: 400 })
    }
    
    console.log(`\n🤖 SECURED AI BUSINESS INTELLIGENCE [${security.userRole?.toUpperCase()}]`)
    console.log(`📝 Query: ${message}`)
    
    // **STEP 4: GET SECURED BUSINESS DATA**
    const businessData = await getSecuredBusinessData(security.userRole!)
    
    // **STEP 5: PREPARE AI CONTEXT**
    let aiContext = `You are a Secured Business Intelligence AI with role-based access.

SECURITY LEVEL: ${security.userRole?.toUpperCase()}
USER QUERY: ${message}

AVAILABLE DATA:
📱 WhatsApp Messages: ${businessData.whatsapp_messages.length}
👥 Leads: ${businessData.leads.length}
💰 Quotations: ${businessData.quotations.length}
📋 Tasks: ${businessData.tasks.length}
👥 Employees: ${businessData.employees.length}
`

    if (businessData.whatsapp_messages.length > 0) {
      aiContext += '\nRECENT WHATSAPP INTERACTIONS:\n'
      businessData.whatsapp_messages.slice(0, 5).forEach((msg: any, index: number) => {
        aiContext += `${index + 1}. From: ${msg.from_phone} | "${msg.content}" | ${new Date(msg.timestamp).toLocaleDateString()}\n`
      })
    }
    
    if (businessData.leads.length > 0 && security.userRole === 'admin') {
      aiContext += '\nRECENT LEADS:\n'
      businessData.leads.slice(0, 3).forEach((lead: any, index: number) => {
        aiContext += `${index + 1}. ${lead.name} | ${lead.mobile} | Status: ${lead.status} | Source: ${lead.source} | Assigned: ${lead.assigned_to_name || 'Unassigned'}\n`
      })
    }
    
    if (businessData.quotations.length > 0 && security.userRole === 'admin') {
      aiContext += '\nRECENT QUOTATIONS:\n'
      businessData.quotations.slice(0, 3).forEach((quot: any, index: number) => {
        aiContext += `${index + 1}. ${quot.quotation_number} | ${quot.client_name} | ₹${quot.total_amount} | Status: ${quot.status} | Created by: ${quot.created_by_name}\n`
      })
    }
    
    if (businessData.tasks.length > 0) {
      aiContext += '\nRECENT TASKS:\n'
      businessData.tasks.slice(0, 3).forEach((task: any, index: number) => {
        aiContext += `${index + 1}. ${task.title} | Status: ${task.status} | Priority: ${task.priority} | Assigned: ${task.employee_name || 'Unassigned'}\n`
      })
    }
    
    aiContext += `\nProvide intelligent business insights based on this data. Be specific about what you can analyze and recommend actionable next steps.`
    
    // **STEP 6: CALL SECURED OLLAMA AI**
    const startTime = Date.now()
    const aiResponse = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        prompt: aiContext,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1000 // Limit response size
        }
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })
    
    if (!aiResponse.ok) {
      throw new Error(`AI service error: ${aiResponse.status}`)
    }
    
    const aiResult = await aiResponse.json()
    const processingTime = Date.now() - startTime
    
    // Calculate confidence based on data availability
    const dataPoints = businessData.whatsapp_messages.length + businessData.leads.length + 
                      businessData.quotations.length + businessData.tasks.length + businessData.employees.length
    const confidence = Math.min(0.95, 0.3 + (dataPoints * 0.02))
    
    return NextResponse.json({
      success: true,
      ai_response: aiResult.response,
      confidence: confidence,
      security: {
        level: security.userRole,
        authenticated: true,
        data_access: {
          whatsapp_messages: businessData.whatsapp_messages.length,
          leads: security.userRole === 'admin' ? businessData.leads.length : 'restricted',
          quotations: security.userRole === 'admin' ? businessData.quotations.length : 'restricted',
          tasks: businessData.tasks.length,
          employees: businessData.employees.length
        }
      },
      performance: {
        processing_time_ms: processingTime,
        data_points_analyzed: dataPoints,
        ai_model: 'llama3.1:8b'
      },
      database: {
        source: 'PostgreSQL',
        connection_pool: 'active'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ AI Business Intelligence Error:', error.message)
    
    return NextResponse.json({
      success: false,
      error: 'AI processing temporarily unavailable',
      details: error.message,
      fallback_suggestion: 'Try a simpler query or contact support'
    }, { status: 500 })
  }
}

export async function GET() {
  const client = await pool.connect()
  try {
    // Test PostgreSQL connection and get basic stats
    const dbResult = await client.query('SELECT NOW() as timestamp, version() as pg_version')
    const dbInfo = dbResult.rows[0]
    
    // Get data availability stats
    const statsQueries = await Promise.allSettled([
      client.query('SELECT COUNT(*) as count FROM whatsapp_messages'),
      client.query('SELECT COUNT(*) as count FROM leads'),
      client.query('SELECT COUNT(*) as count FROM quotations'), 
      client.query('SELECT COUNT(*) as count FROM tasks'),
      client.query('SELECT COUNT(*) as count FROM employees WHERE status = $1', ['active'])
    ])
    
    const stats = {
      whatsapp_messages: statsQueries[0].status === 'fulfilled' ? parseInt(statsQueries[0].value.rows[0].count) : 0,
      leads: statsQueries[1].status === 'fulfilled' ? parseInt(statsQueries[1].value.rows[0].count) : 0,
      quotations: statsQueries[2].status === 'fulfilled' ? parseInt(statsQueries[2].value.rows[0].count) : 0,
      tasks: statsQueries[3].status === 'fulfilled' ? parseInt(statsQueries[3].value.rows[0].count) : 0,
      employees: statsQueries[4].status === 'fulfilled' ? parseInt(statsQueries[4].value.rows[0].count) : 0
    }
    
    return NextResponse.json({
      service: 'Secured AI Business Intelligence',
      version: '2.0.0 - PostgreSQL',
      database: {
        status: "connected",
        timestamp: dbInfo.timestamp,
        version: dbInfo.pg_version,
        data_availability: stats
      },
      security: {
        authentication: 'required',
        rate_limiting: 'enabled',
        audit_logging: 'enabled',
        data_classification: 'BUSINESS_SENSITIVE',
        emergency_disconnect: existsSync(AI_EMERGENCY_FLAG) ? 'ACTIVE' : 'INACTIVE'
      },
      access_levels: {
        authenticated: 'Basic business insights, limited WhatsApp messages and tasks',
        admin: 'Full business data access, complete lead and quotation information'
      },
      usage: {
        endpoint: '/api/ai-business-intelligence',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_AI_SECRET_TOKEN',
          'Content-Type': 'application/json'
        },
        body: {
          message: 'Your business intelligence query'
        }
      },
      rate_limits: {
        authenticated: `${RATE_LIMIT_PER_MINUTE} requests per minute`,
        admin: `${RATE_LIMIT_PER_MINUTE} requests per minute`
      },
      ai_capabilities: [
        '🧠 Advanced business data analysis',
        '📊 Real-time performance insights', 
        '🎯 Actionable recommendations',
        '🔒 Role-based data access',
        '⚡ Fast response times',
        '🛡️ Enterprise security'
      ]
    })
  } catch (error) {
    console.error('❌ AI Business Intelligence status error:', error)
    return NextResponse.json({
      service: 'Secured AI Business Intelligence',
      status: 'Error retrieving status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    client.release()
  }
} 