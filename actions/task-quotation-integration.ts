'use server'

import { query, transaction } from '@/lib/postgresql-client'

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
  console.log('📊 Generating new quotation number...')
  
  // Get current year and month
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  
  // Get count of quotations this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const countResult = await query(
    'SELECT COUNT(*) as count FROM quotations WHERE created_at >= $1',
    [startOfMonth.toISOString()]
  )
  
  const count = parseInt(countResult.rows[0]?.count || '0')
  const sequence = (count + 1).toString().padStart(4, '0')
  const quotationNumber = `QT-${year}${month}-${sequence}`
  
  console.log(`✅ Generated quotation number: ${quotationNumber}`)
  return quotationNumber
}

// Helper function to generate unique slug
async function generateQuotationSlug(quotationNumber: string): Promise<string> {
  console.log(`🔄 Generating unique slug for quotation: ${quotationNumber}`)
  
  const baseSlug = quotationNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const slug = `${baseSlug}-${randomSuffix}`
    
    const existingResult = await query(
      'SELECT id FROM quotations WHERE slug = $1 LIMIT 1',
      [slug]
    )
    
    if (existingResult.rows.length === 0) {
      console.log(`✅ Generated unique slug: ${slug}`)
      return slug
    }
    
    attempts++
  }
  
  const fallbackSlug = `${baseSlug}-${Date.now()}`
  console.log(`⚠️ Using fallback slug: ${fallbackSlug}`)
  return fallbackSlug
}

/**
 * Prepare quotation data from completed task and redirect to quotation creation page
 * This follows the same workflow as the follow-up "generate quotation" functionality
 */
export async function createQuotationFromTask(data: QuotationFromTaskData) {
  try {
    console.log('🔄 Preparing quotation creation from task:', data.task_id)
    
    // 1. Get lead information
    console.log('📋 Fetching lead information...')
    const leadResult = await query(
      'SELECT * FROM leads WHERE id = $1',
      [data.lead_id]
    )
    
    if (leadResult.rows.length === 0) {
      throw new Error(`Lead not found with ID: ${data.lead_id}`)
    }
    
    const lead = leadResult.rows[0]
    console.log(`✅ Found lead: ${lead.company_name || lead.name}`)
    
    // 2. Get task information
    console.log('📋 Fetching task information...')
    const taskResult = await query(
      'SELECT * FROM ai_tasks WHERE id = $1',
      [data.task_id]
    )
    
    if (taskResult.rows.length === 0) {
      throw new Error(`Task not found with ID: ${data.task_id}`)
    }
    
    const task = taskResult.rows[0]
    console.log(`✅ Found task: ${task.title}`)

    // 3. Update task to mark that quotation process was initiated
    console.log('🔄 Updating task metadata...')
    const updatedMetadata = {
      ...(task.metadata || {}),
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

    await query(
      'UPDATE ai_tasks SET metadata = $1 WHERE id = $2',
      [JSON.stringify(updatedMetadata), data.task_id]
    )
    console.log('✅ Task metadata updated successfully')

    // 4. Prepare URL for quotation creation page with pre-filled data (same as follow-up workflow)
    const quotationFormUrl = new URL('/sales/quotations/generate', 'http://localhost:3000')
    
    // Add lead and task context as URL parameters (following existing pattern)
    quotationFormUrl.searchParams.set('leadId', data.lead_id.toString())
    quotationFormUrl.searchParams.set('taskId', data.task_id)
    quotationFormUrl.searchParams.set('clientName', data.client_name)
    quotationFormUrl.searchParams.set('source', 'task_completion')
    
    // Encode AI context safely for the form
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
    
    // Use encodeURIComponent for safe URL encoding
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
    console.log('📝 Logging task generation initiation...')
    try {
      await query(
        `INSERT INTO task_generation_log 
         (lead_id, trigger_event, business_rule_applied, task_id, success, ai_reasoning, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          data.lead_id,
          'task_to_quotation_initiated',
          'task_completion_quotation_initiation',
          parseInt(data.task_id),
          true,
          `Quotation creation initiated from completed task: ${data.context.task_title}`,
          JSON.stringify({
            client_requirements: data.context.client_requirements,
            budget_range: data.context.budget_range,
            urgency: data.context.urgency,
            estimated_value: data.context.estimated_value,
            redirect_url: quotationFormUrl.pathname + quotationFormUrl.search
          })
        ]
      )
      console.log('✅ Task generation log entry created')
    } catch (logError) {
      console.warn('⚠️ Could not log task generation initiation:', logError)
    }
    
    console.log('✅ Quotation creation prepared, redirecting to comprehensive creation page')
    
    return {
      success: true,
      redirect_url: quotationFormUrl.pathname + quotationFormUrl.search,
      message: 'Redirecting to quotation creation page with pre-filled task context.',
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
    console.log(`📋 Fetching quotation context for task: ${taskId}`)
    
    const taskResult = await query(
      `SELECT 
        t.*,
        l.id as lead_id,
        l.company_name,
        l.name as lead_name,
        l.contact_person,
        l.email,
        l.phone
       FROM ai_tasks t
       INNER JOIN leads l ON t.lead_id = l.id
       WHERE t.id = $1`,
      [taskId]
    )
    
    if (taskResult.rows.length === 0) {
      throw new Error(`Task not found with ID: ${taskId}`)
    }
    
    const task = taskResult.rows[0]
    console.log(`✅ Found task context: ${task.title}`)
    
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
        lead_data: {
          id: task.lead_id,
          company_name: task.company_name,
          name: task.lead_name,
          contact_person: task.contact_person,
          email: task.email,
          phone: task.phone
        }
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