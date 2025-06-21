import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    // Create a test lead with phone number (minimal required fields)
    const leadData = {
      lead_number: `TEST-${Date.now()}`,
      client_name: 'Test Client John',
      email: 'john.test@example.com',
      phone: '9876543210',
      country_code: '+91',
      whatsapp_number: '9876543210',
      is_whatsapp: true,
      notes: 'Test lead for phone number functionality',
      status: 'ASSIGNED',
      company_id: 1, // Use existing company ID
      location: 'Test City'
    }
    
    const { data: lead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select('*')
      .single()
    
    if (error) {
      console.error('Error creating test lead:', error)
      return NextResponse.json({ error: 'Failed to create test lead', details: error.message }, { status: 500 })
    }
    
    // Now create a test task linked to this lead
    const taskData = {
      task_title: '🧪 Test Active Task - Call Client',
      task_description: 'Active test task to verify quick action buttons work with phone numbers',
      task_type: 'client_followup',
      priority: 'medium',
      status: 'pending',
      lead_id: lead.id,
      client_name: lead.client_name,
      business_impact: 'medium',
      estimated_value: 0
    }
    
    const { data: task, error: taskError } = await supabase
      .from('ai_tasks')
      .insert(taskData)
      .select('*')
      .single()
    
    if (taskError) {
      console.error('Error creating test task:', taskError)
      return NextResponse.json({ 
        success: true, 
        lead, 
        task_error: taskError.message,
        message: 'Lead created but task creation failed'
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      lead, 
      task,
      message: 'Test lead and task created successfully!'
    })
  } catch (error: any) {
    console.error('Exception creating test lead:', error)
    return NextResponse.json({ error: 'Exception', details: error.message }, { status: 500 })
  }
} 