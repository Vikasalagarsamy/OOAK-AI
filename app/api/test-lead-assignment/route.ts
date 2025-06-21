import { createClient } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'
import { triggerLeadAssignmentTasks } from '@/actions/lead-task-integration-hooks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, leadData, triggeredBy } = body

    console.log('🧪 Testing lead assignment for:', leadData.client_name)

    // Call the integration hook to test AI task generation
    const result = await triggerLeadAssignmentTasks(leadId, leadData, triggeredBy)

    console.log('🎯 Test result:', result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ Test API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test failed due to server error',
      error: error.message,
      tasksGenerated: 0,
      insights: []
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Lead-Task Integration Test API',
    status: 'operational',
    endpoints: {
      'POST /api/test-lead-assignment': 'Test lead assignment and task generation'
    }
  })
} 