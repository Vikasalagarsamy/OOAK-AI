import { NextRequest, NextResponse } from 'next/server'
import { triggerLeadAssignmentTasks } from '@/actions/lead-task-integration-hooks'

/**
 * 🧪 TEST TASK ASSIGNMENT API
 * 
 * This endpoint tests task creation for lead assignment
 * to ensure tasks are properly assigned to the lead owner
 */

export async function POST(request: NextRequest) {
  try {
    const { leadId, assignedTo } = await request.json()
    
    console.log(`🧪 Testing task assignment for lead ${leadId} assigned to employee ${assignedTo}`)
    
    // Create test lead data
    const testLeadData = {
      id: leadId,
      lead_number: `L${leadId.toString().padStart(4, '0')}`,
      client_name: 'Test Client - Guru',
      status: 'ASSIGNED' as const,
      estimated_value: 50000,
      assigned_to: assignedTo, // This should be the employee ID (like Sridhar's ID)
      company_id: 1,
      branch_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Trigger task generation
    const result = await triggerLeadAssignmentTasks(
      leadId,
      testLeadData,
      'Test Assignment API'
    )
    
    console.log('🧪 Task generation result:', result)
    
    return NextResponse.json({
      success: true,
      message: `Test completed for lead ${leadId}`,
      result,
      testData: testLeadData
    })
    
  } catch (error) {
    console.error('❌ Test task assignment error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 