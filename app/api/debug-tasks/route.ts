import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    // Get recent tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('ai_tasks')
      .select('id, task_title, lead_id, client_name')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (tasksError) {
      return NextResponse.json({ error: 'Tasks error', details: tasksError })
    }
    
    // Get ALL leads to see what exists (using correct column names)
    const { data: allLeads, error: allLeadsError } = await supabase
      .from('leads')
      .select('id, client_name, phone, country_code, whatsapp_number')
      .limit(20)
    
    if (allLeadsError) {
      return NextResponse.json({ error: 'All leads error', details: allLeadsError })
    }
    
    // Get leads with phone numbers for the specific lead IDs
    const leadIds = tasks?.filter(t => t.lead_id).map(t => t.lead_id) || []
    let specificLeads: any[] = []
    
    if (leadIds.length > 0) {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, client_name, phone, country_code, whatsapp_number')
        .in('id', leadIds)
      
      if (!leadsError && leadsData) {
        specificLeads = leadsData
      }
    }
    
    // Combine data
    const result = {
      tasks: tasks?.map(task => ({
        ...task,
        lead_phone: specificLeads.find(l => l.id === task.lead_id)?.phone || null
      })),
      all_leads: allLeads,
      specific_leads: specificLeads,
      lead_ids_requested: leadIds,
      summary: {
        total_tasks: tasks?.length || 0,
        tasks_with_leads: tasks?.filter(t => t.lead_id).length || 0,
        total_leads_in_db: allLeads?.length || 0,
        specific_leads_found: specificLeads?.length || 0,
        leads_with_phones: allLeads?.filter(l => l.phone).length || 0
      }
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: 'Exception', details: error.message })
  }
} 