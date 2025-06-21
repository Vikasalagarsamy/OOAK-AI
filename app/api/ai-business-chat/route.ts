import { NextRequest, NextResponse } from 'next/server'
import { directBusinessAIService } from '@/services/direct-business-ai-service'

export async function POST(request: NextRequest) {
  console.log('🤖 Processing Direct Business AI Chat Query')
  
  try {
    const { message, userId } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Process the query through the direct business AI system
    const response = await directBusinessAIService.processQuery(message, userId || 'user')

    const processingTime = Date.now() - startTime

    console.log(`✅ Direct Business AI query processed in ${processingTime}ms`)
    console.log(`📊 Data used: ${response.data_used.leads} leads, ${response.data_used.quotations} quotations, ${response.data_used.tasks} tasks, ${response.data_used.employees} employees`)

    return NextResponse.json({
      success: true,
      response: response.response,
      confidence: response.confidence,
      sources: response.sources,
      data_used: response.data_used,
      suggested_actions: response.suggested_actions,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Direct Business AI chat error:', error)
    
    return NextResponse.json({
      success: false,
      response: "I apologize, but I'm having trouble accessing the business data right now. Please try again in a moment.",
      confidence: 0.0,
      sources: [],
      data_used: { leads: 0, quotations: 0, tasks: 0, employees: 0 },
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('🔍 Getting Direct Business AI System Status')
  
  try {
    const systemHealth = await directBusinessAIService.getSystemHealth()

    return NextResponse.json({
      message: '🚀 Direct Business AI System',
      description: 'AI system with direct access to your business data for autonomous responses',
      system_health: systemHealth,
      capabilities: [
        '📊 Direct access to leads, quotations, tasks, and employee data',
        '🧠 Intelligent query processing with business context',
        '💡 Autonomous responses based on real business data',
        '🎯 Smart data filtering based on query intent',
        '📈 Actionable business insights and suggestions',
        '⚡ Fast response times with optimized data access',
        '🔒 Secure access to your existing business database'
      ],
      example_queries: [
        'What\'s our current revenue from quotations?',
        'Show me recent leads from Instagram',
        'What tasks are pending for Harish?',
        'Who are our team members?',
        'What\'s the status of our highest value quotations?',
        'Which leads need follow-up?',
        'What\'s our total business pipeline value?'
      ],
      data_access: {
        leads_available: systemHealth.business_data_summary.total_leads || 0,
        quotations_available: systemHealth.business_data_summary.total_quotations || 0,
        tasks_available: systemHealth.business_data_summary.total_tasks || 0,
        employees_available: systemHealth.business_data_summary.total_employees || 0
      }
    })

  } catch (error) {
    console.error('❌ Error getting Direct Business AI status:', error)
    
    return NextResponse.json({
      message: 'Direct Business AI System',
      status: 'Error retrieving status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 