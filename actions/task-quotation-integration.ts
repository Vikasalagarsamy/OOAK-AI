'use server'

import { createClient } from '@/lib/supabase/server'

interface QuotationFromTaskData {
  lead_id: number
  task_id: string
  client_name: string
  context: {
    task_title: string
    completion_notes?: string
    client_requirements: string
    budget_range: string
    project_scope: string
    timeline: string
    urgency: 'standard' | 'urgent' | 'asap'
    estimated_value: number
    business_impact: string
    source: 'task_completion'
  }
}

// Helper function to generate quotation number
async function generateQuotationNumber(): Promise<string> {
  const supabase = createClient()
  
  // Get current year and month
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  
  // Get count of quotations this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const { count } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())
  
  const sequence = ((count || 0) + 1).toString().padStart(4, '0')
  return `QT${year}${month}${sequence}`
}

// Helper function to generate unique slug
async function generateQuotationSlug(quotationNumber: string): Promise<string> {
  const supabase = createClient()
  
  const baseSlug = quotationNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const slug = `${baseSlug}-${randomSuffix}`
    
    const { data: existing } = await supabase
      .from('quotations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    
    if (!existing) {
      return slug
    }
    
    attempts++
  }
  
  return `${baseSlug}-${Date.now()}`
}

/**
 * Prepare quotation data from completed task and redirect to creation form
 * This integrates with the existing 3-step quotation creation flow
 */
export async function createQuotationFromTask(data: QuotationFromTaskData) {
  try {
    const supabase = createClient()
    
    console.log('🔄 Preparing quotation data from task:', data.task_id)
    
    // 1. Get lead information
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', data.lead_id)
      .single()
    
    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message}`)
    }
    
    // 2. Get task information
    const { data: task, error: taskError } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', data.task_id)
      .single()
    
    if (taskError || !task) {
      throw new Error(`Task not found: ${taskError?.message}`)
    }
    
    // 3. Update task to mark that quotation process was initiated
    await supabase
      .from('ai_tasks')
      .update({
        metadata: {
          ...task.metadata,
          quotation_initiated: true,
          quotation_initiated_at: new Date().toISOString(),
          quotation_context: {
            client_requirements: data.context.client_requirements,
            budget_range: data.context.budget_range,
            project_scope: data.context.project_scope,
            timeline_required: data.context.timeline,
            urgency_level: data.context.urgency,
            business_impact: data.context.business_impact,
            estimated_value: data.context.estimated_value
          }
        }
      })
      .eq('id', data.task_id)
    
    // 4. Prepare URL for quotation creation form with pre-filled data
    const quotationFormUrl = new URL('/sales/quotations/generate', 'http://localhost:3000')
    
    // Add lead and task context as URL parameters
    quotationFormUrl.searchParams.set('leadId', data.lead_id.toString())
    quotationFormUrl.searchParams.set('taskId', data.task_id)
    quotationFormUrl.searchParams.set('clientName', data.client_name)
    quotationFormUrl.searchParams.set('source', 'task_completion')
    
    // Encode AI context safely for the form (using URL encoding instead of base64)
    const aiContext = {
      task_title: data.context.task_title,
      client_requirements: data.context.client_requirements,
      budget_range: data.context.budget_range,
      project_scope: data.context.project_scope,
      timeline: data.context.timeline,
      urgency: data.context.urgency,
      estimated_value: data.context.estimated_value,
      business_impact: data.context.business_impact,
      completion_notes: data.context.completion_notes
    }
    
    // Use encodeURIComponent instead of btoa to handle Unicode characters safely
    try {
      quotationFormUrl.searchParams.set('aiContext', encodeURIComponent(JSON.stringify(aiContext)))
    } catch (error) {
      console.warn('⚠️ Failed to encode AI context, using fallback:', error)
      // Fallback: create simplified context without problematic characters
      const fallbackContext = {
        task_title: 'Task completion data available',
        client_requirements: 'See task completion notes',
        budget_range: data.context.budget_range || 'Not specified',
        timeline: data.context.timeline || 'Not specified',
        urgency: data.context.urgency || 'standard',
        estimated_value: data.context.estimated_value || 0
      }
      quotationFormUrl.searchParams.set('aiContext', encodeURIComponent(JSON.stringify(fallbackContext)))
    }
    
    // 5. Log the task-to-quotation initiation (if table exists)
    try {
      await supabase
        .from('task_generation_log')
        .insert({
          lead_id: data.lead_id,
          trigger_event: 'task_to_quotation_initiated',
          business_rule_applied: 'task_completion_quotation_initiation',
          task_id: parseInt(data.task_id),
          success: true,
          ai_reasoning: `Quotation creation initiated from completed task: ${data.context.task_title}`,
          metadata: {
            client_requirements: data.context.client_requirements,
            budget_range: data.context.budget_range,
            urgency: data.context.urgency,
            estimated_value: data.context.estimated_value,
            redirect_url: quotationFormUrl.pathname + quotationFormUrl.search
          }
        })
    } catch (logError) {
      console.warn('⚠️ Could not log task generation initiation:', logError)
    }
    
    console.log('✅ Quotation creation prepared, redirecting to form')
    
    return {
      success: true,
      redirect_url: quotationFormUrl.pathname + quotationFormUrl.search,
      message: 'Redirecting to quotation creation form with pre-filled data from task context.',
      lead_id: data.lead_id,
      task_id: data.task_id,
      ai_context: aiContext
    }
    
  } catch (error: any) {
    console.error('❌ Error preparing quotation from task:', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to prepare quotation from task'
    }
  }
}

/**
 * Get quotation context from task for pre-filling forms
 */
export async function getQuotationContextFromTask(taskId: string) {
  try {
    const supabase = createClient()
    
    const { data: task, error } = await supabase
      .from('ai_tasks')
      .select(`
        *,
        leads!inner(*)
      `)
      .eq('id', taskId)
      .single()
    
    if (error || !task) {
      throw new Error(`Task not found: ${error?.message}`)
    }
    
    return {
      success: true,
      context: {
        task_id: task.id,
        task_title: task.title,
        client_name: task.client_name,
        lead_id: task.lead_id,
        completion_notes: task.metadata?.completion_notes,
        estimated_value: task.estimated_value,
        business_impact: task.business_impact,
        lead_data: task.leads
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error getting task context:', error)
    return {
      success: false,
      error: error.message
    }
  }
} 