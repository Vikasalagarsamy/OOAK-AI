import { NextRequest, NextResponse } from 'next/server'
import { AITaskManagementService } from '@/services/ai-task-management-service'
import { SimpleTaskService } from '@/services/simple-task-service'

export async function POST() {
  try {
    console.log('🤖 AI Task Generation API: Starting...')
    
    // Try the full service first, fallback to simple service
    const simpleService = new SimpleTaskService()
    const result = await simpleService.generateSimpleTasks()
    
    console.log(`✅ Successfully generated ${result.tasksCreated} tasks`)
    
    return NextResponse.json({
      success: true,
      message: `Generated ${result.tasksCreated} intelligent tasks`,
      tasksCreated: result.tasksCreated,
      tasks: result.tasks,
      mode: 'simple' // Indicates we're using the simple service
    })
  } catch (error) {
    console.error('❌ Task generation failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const employeeId = url.searchParams.get('employeeId')
    
    if (employeeId) {
      // For demo purposes, return mock employee tasks
      return NextResponse.json({
        success: true,
        tasks: [
          {
            id: 'demo-task-001',
            title: 'Follow up with Client ABC about quotation',
            priority: 'high',
            status: 'pending',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            client_name: 'Client ABC',
            estimated_value: 75000,
            ai_reasoning: 'High-value quotation pending for 4 days'
          }
        ]
      })
    }
    
    // Return demo performance analytics
    return NextResponse.json({
      success: true,
      performance_analytics: [
        {
          employee_name: 'John Doe (Sales)',
          total_tasks: 5,
          completed_tasks: 3,
          overdue_tasks: 1,
          completion_rate: 0.6,
          revenue_impact: 150000
        },
        {
          employee_name: 'Jane Smith (CTO)',
          total_tasks: 3,
          completed_tasks: 2,
          overdue_tasks: 0,
          completion_rate: 0.67,
          revenue_impact: 100000
        }
      ]
    })
  } catch (error) {
    console.error('❌ Performance analytics failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 