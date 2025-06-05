import { NextRequest, NextResponse } from 'next/server'
import { createQuotationFromTask } from '@/actions/task-quotation-integration'

// POST /api/quotations/from-task - Create quotation from completed task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 API: Creating quotation from task:', body)
    
    // Validate request body
    if (!body.task_id || !body.lead_id || !body.client_name) {
      return NextResponse.json(
        { error: 'Missing required fields: task_id, lead_id, client_name' },
        { status: 400 }
      )
    }
    
    // Call server action
    const result = await createQuotationFromTask(body)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        quotation_id: result.quotation_id,
        message: result.message
      }, { status: 201 })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: result.message
      }, { status: 400 })
    }
    
  } catch (error: any) {
    console.error('❌ API Error creating quotation from task:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 