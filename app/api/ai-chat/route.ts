import { NextRequest, NextResponse } from 'next/server'
import { AIBusinessIntelligenceService } from '@/services/ai-business-intelligence-service'
import { LocalLLMService, getLLMConfigFromEnv, LLMConfigBuilder } from '@/services/local-llm-service'
import { AITaskManagementService } from '@/services/ai-task-management-service'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    console.log(`🤖 AI: Processing request: "${message}"`)

    // Initialize services
    const biService = new AIBusinessIntelligenceService()
    
    // Get LLM config
    let llmConfig = getLLMConfigFromEnv()
    if (!llmConfig) {
      llmConfig = LLMConfigBuilder.ollama('llama3:latest')
    }
    
    const llmService = new LocalLLMService(llmConfig)
    const taskService = new AITaskManagementService()

    console.log("🤖 AI: Fetching comprehensive business data...")
    const businessData = await biService.getComprehensiveBusinessData()

    // Check if this is a task-related query
    const isTaskQuery = message.toLowerCase().includes('task') || 
                       message.toLowerCase().includes('deadline') ||
                       message.toLowerCase().includes('assignment') ||
                       message.toLowerCase().includes('complete') ||
                       message.toLowerCase().includes('todo')

    // Auto-generate tasks if business data shows opportunities
    let taskCreationResult = null
    if (businessData.sales.quotationDetails.length > 0 || isTaskQuery) {
      console.log("🤖 AI: Checking for task generation opportunities...")
      taskCreationResult = await taskService.generateAITasks()
    }

    // Enhanced context with task management
    const enhancedContext = `
    COMPREHENSIVE BUSINESS INTELLIGENCE & TASK MANAGEMENT CONTEXT:
    ===================================================================

    SALES ANALYTICS:
    - Total Revenue: ₹${businessData.sales.totalRevenue.toLocaleString()}
    - Quotations: ${businessData.sales.totalQuotations} (Conversion: ${(businessData.sales.conversionRate * 100).toFixed(1)}%)
    - Average Quote Value: ₹${businessData.sales.averageQuotationValue.toLocaleString()}
    
    DETAILED QUOTATIONS:
    ${businessData.sales.quotationDetails.map(q => 
      `• ${q.client_name}: ₹${q.total_amount.toLocaleString()} (${q.status}) - Created: ${new Date(q.created_at).toLocaleDateString()}`
    ).join('\n')}

    TEAM PERFORMANCE:
    - Total Employees: ${businessData.employees.totalEmployees}
    - Department Distribution: ${businessData.employees.departmentDistribution.map(dept => `${dept.department}: ${dept.count}`).join(', ')}
    
    TEAM MEMBERS:
    ${businessData.employees.employeeDetails.map(emp => 
      `• ${emp.name} - ${emp.position} (${emp.department})`
    ).join('\n')}

    🎯 AI TASK MANAGEMENT INTELLIGENCE:
    ==========================================
    
    CURRENT TASK STATUS:
    - Active Tasks: ${businessData.taskManagement.totalActiveTasks}
    - Completed Tasks: ${businessData.taskManagement.completedTasks}
    - Overdue Tasks: ${businessData.taskManagement.overdueTasks}
    - Completion Rate: ${(businessData.taskManagement.taskCompletionRate * 100).toFixed(1)}%

    PRIORITY BREAKDOWN:
    ${Object.entries(businessData.taskManagement.tasksByPriority).map(([priority, count]) => 
      `- ${priority.toUpperCase()}: ${count} tasks`
    ).join('\n')}

    TASK TYPE DISTRIBUTION:
    ${Object.entries(businessData.taskManagement.tasksByType).map(([type, count]) => 
      `- ${type.replace(/_/g, ' ').toUpperCase()}: ${count} tasks`
    ).join('\n')}

    EMPLOYEE TASK PERFORMANCE:
    ${businessData.taskManagement.employeePerformance.map(emp => 
      `• ${emp.employee_name}: ${emp.completed_tasks}/${emp.total_tasks} completed (${(emp.completion_rate * 100).toFixed(1)}%) - Revenue Impact: ₹${emp.revenue_impact.toLocaleString()}`
    ).join('\n')}

    🚨 UPCOMING DEADLINES (Next 7 Days):
    ${businessData.taskManagement.upcomingDeadlines.length > 0 
      ? businessData.taskManagement.upcomingDeadlines.map(task => 
          `• ${task.title} - Due: ${new Date(task.due_date).toLocaleDateString()} (${task.priority}) - Assigned: ${task.assigned_to}${task.client_name ? ` - Client: ${task.client_name}` : ''}`
        ).join('\n')
      : '• No upcoming deadlines'}

    🤖 AI AUTOMATION INSIGHTS:
    - Tasks Generated (30 days): ${businessData.taskManagement.aiTaskInsights.tasksGenerated}
    - Automation Success Rate: ${(businessData.taskManagement.aiTaskInsights.automationSuccessRate * 100).toFixed(1)}%
    - Revenue Protected: ₹${businessData.taskManagement.aiTaskInsights.revenueProtected.toLocaleString()}
    - Time Saved: ${businessData.taskManagement.aiTaskInsights.timesSaved} minutes

    ${taskCreationResult && taskCreationResult.tasksCreated > 0 ? `
    🎯 AUTOMATIC TASK CREATION ALERT:
    Just created ${taskCreationResult.tasksCreated} new intelligent tasks:
    ${taskCreationResult.tasks.map(task => 
      `• ${task.title} (${task.priority}) - Assigned to Employee ID: ${task.assigned_to_employee_id} - Due: ${new Date(task.due_date).toLocaleDateString()}`
    ).join('\n')}
    ` : ''}

    OPERATIONS & WORKFLOWS:
    - Total Clients: ${businessData.operations.totalClients}
    - Active Leads: ${businessData.operations.activeLeads}
    - Lead Conversion: ${(businessData.operations.leadConversionRate * 100).toFixed(1)}%
    - Workflow Status: ${businessData.workflows.quotationWorkflow.map(w => `${w.stage}: ${w.count}`).join(', ')}

    AI SYSTEM PERFORMANCE:
    - Revenue Forecast: ${businessData.ai_insights.revenueForecast ? `${businessData.ai_insights.revenueForecast.period}: ₹${businessData.ai_insights.revenueForecast.predicted.toLocaleString()} (${(businessData.ai_insights.revenueForecast.confidence * 100).toFixed(1)}% confidence)` : 'No forecast available'}
    - Client Insights: ${businessData.ai_insights.clientInsights.length} insights available
    - Action Recommendations: ${businessData.ai_insights.actionRecommendations.length} recommendations

    URGENT NOTIFICATIONS:
    - Unread Notifications: ${businessData.notifications.unreadCount}
    - Urgent Alerts: ${businessData.notifications.urgentCount}

    BUSINESS PERFORMANCE METRICS:
    - Client Satisfaction: ${businessData.performance.clientSatisfactionScore}%
    - Team Productivity: ${businessData.performance.teamProductivity}%
    - Quotation Response Time: ${businessData.performance.quotationResponseTime} hours

    USER QUERY: "${message}"

    INTELLIGENCE DIRECTIVE:
    As an AI Business Intelligence Assistant with integrated Task Management capabilities, provide:

    1. IMMEDIATE ACTIONS: Specific tasks that need urgent attention
    2. STRATEGIC INSIGHTS: Business analysis based on real data
    3. TASK RECOMMENDATIONS: Suggest new tasks or modifications to existing ones
    4. PERFORMANCE ANALYSIS: Team and individual productivity insights
    5. REVENUE OPTIMIZATION: Opportunities to protect and grow revenue
    6. AUTOMATION OPPORTUNITIES: Areas where AI can further assist

    Focus on:
    - Concrete action items with deadlines
    - Specific team member assignments
    - Revenue impact quantification
    - Risk identification and mitigation
    - Process optimization recommendations

    Provide actionable, data-driven insights that combine business intelligence with intelligent task management.
    `

    // Generate LLM response with enhanced context
    console.log("🤖 Local LLM Response generated successfully")
    const response = await llmService.generateIntelligentResponse(enhancedContext)

    return NextResponse.json({
      message: response,
      businessData: {
        sales: businessData.sales,
        employees: businessData.employees,
        operations: businessData.operations,
        taskManagement: businessData.taskManagement, // Include task data
        ai_insights: businessData.ai_insights
      },
      taskCreation: taskCreationResult,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI Chat Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process AI request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Test LLM connection status
  const llmConfig = getLLMConfigFromEnv() || LLMConfigBuilder.ollama()
  let connectionStatus = "Not configured"
  
  try {
    const llmService = new LocalLLMService(llmConfig)
    const testResult = await llmService.testConnection()
    connectionStatus = testResult.success ? "✅ Connected" : `❌ ${testResult.message}`
  } catch (error) {
    connectionStatus = `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
  
  return NextResponse.json({
    message: "AI Business Intelligence Chat API",
    localLLM: {
      configured: !!getLLMConfigFromEnv(),
      status: connectionStatus,
      provider: llmConfig?.provider || 'none',
      model: llmConfig?.model || 'none'
    },
    endpoints: {
      POST: "/api/ai-chat - Send a message to get AI business insights",
      GET: "/api/ai-chat - Check LLM connection status"
    },
    setup: {
      instructions: "Set environment variables to configure your local LLM",
      variables: [
        "LOCAL_LLM_PROVIDER=ollama|lmstudio|openai-compatible",
        "LOCAL_LLM_API_URL=http://localhost:11434/api/generate",
        "LOCAL_LLM_MODEL=llama3.2",
        "LOCAL_LLM_API_KEY=optional"
      ]
    }
  })
} 