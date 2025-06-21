import { NextRequest, NextResponse } from 'next/server'
import { triggerLeadAssignmentTasks } from '@/actions/lead-task-integration-hooks'

/**
 * Test API endpoint to manually trigger lead-to-task automation
 * This helps debug why the automation isn't working
 */
export async function POST(request: NextRequest) {
  try {
    const { leadId, leadData, eventType } = await request.json()
    
    console.log('🧪 Test Lead Hook triggered:', { leadId, eventType, clientName: leadData.client_name })
    
    if (eventType === 'lead_assigned') {
      const result = await triggerLeadAssignmentTasks(
        leadId,
        leadData,
        'Manual Test Trigger'
      )
      
      return NextResponse.json({
        success: true,
        message: 'Lead assignment hook tested',
        result,
        debugInfo: {
          leadId,
          clientName: leadData.client_name,
          status: leadData.status,
          assignedTo: leadData.assigned_to,
          estimatedValue: leadData.estimated_value
        }
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Event type not supported for testing'
    })
    
  } catch (error: any) {
    console.error('❌ Test Lead Hook Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 