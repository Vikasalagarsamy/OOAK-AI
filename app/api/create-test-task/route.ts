import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    // Create a test task linked to existing lead ID 5 (Jothi Alagarsamy with phone 9677362524)
    const taskData = {
      task_title: '🧪 Test Active Task - Call Client About Services',
      task_description: 'Active test task to verify quick action buttons work with phone numbers. This task should show Call/WhatsApp buttons and quick action buttons.',
      task_type: 'client_followup',
      priority: 'medium',
      status: 'pending',
      lead_id: 5, // Existing lead with phone number
      client_name: 'Jothi Alagarsamy',
      business_impact: 'medium',
      estimated_value: 0
    }
    
    const { data: task, error } = await supabase
      .from('ai_tasks')
      .insert(taskData)
      .select('*')
      .single()
    
    if (error) {
      console.error('Error creating test task:', error)
      return NextResponse.json({ error: 'Failed to create test task', details: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      task,
      message: 'Test task created successfully! Refresh the page to see it in Active Tasks.'
    })
  } catch (error: any) {
    console.error('Exception creating test task:', error)
    return NextResponse.json({ error: 'Exception', details: error.message }, { status: 500 })
  }
} 