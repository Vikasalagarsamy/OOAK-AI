import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    console.log('🔄 Starting manual task-quotation sync...')
    
    // First get all tasks that have quotation_id
    const { data: tasksWithQuotations, error: tasksError } = await supabase
      .from('ai_tasks')
      .select('id, task_title, quotation_id, estimated_value, client_name')
      .not('quotation_id', 'is', null)

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
    }

    if (!tasksWithQuotations || tasksWithQuotations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tasks with quotations found',
        updated: 0
      })
    }

    // Get unique quotation IDs
    const quotationIds = [...new Set(tasksWithQuotations.map(task => task.quotation_id))]
    
    // Get quotation details
    const { data: quotations, error: quotationsError } = await supabase
      .from('quotations')
      .select('id, total_amount, client_name')
      .in('id', quotationIds)

    if (quotationsError) {
      throw new Error(`Failed to fetch quotations: ${quotationsError.message}`)
    }

    // Create a map for quick lookup
    const quotationMap = new Map()
    quotations?.forEach(q => quotationMap.set(q.id, q))

    let updatedCount = 0
    const updates = []

    for (const task of tasksWithQuotations) {
      const quotation = quotationMap.get(task.quotation_id)
      if (!quotation) {
        updates.push({
          taskId: task.id,
          status: 'quotation_not_found',
          quotationId: task.quotation_id
        })
        continue
      }
      
      // Check if values need updating
      const needsValueUpdate = Math.abs((task.estimated_value || 0) - quotation.total_amount) > 0.01
      const needsNameUpdate = task.client_name !== quotation.client_name
      
      if (needsValueUpdate || needsNameUpdate) {
        console.log(`🔄 Syncing task ${task.id}: ₹${task.estimated_value} → ₹${quotation.total_amount}`)
        
        const { error: updateError } = await supabase
          .from('ai_tasks')
          .update({
            estimated_value: quotation.total_amount,
            client_name: quotation.client_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', task.id)

        if (updateError) {
          console.error(`❌ Failed to update task ${task.id}:`, updateError)
          updates.push({
            taskId: task.id,
            status: 'error',
            error: updateError.message
          })
        } else {
          updatedCount++
          updates.push({
            taskId: task.id,
            status: 'updated',
            oldValue: task.estimated_value,
            newValue: quotation.total_amount,
            oldName: task.client_name,
            newName: quotation.client_name
          })
        }
      } else {
        updates.push({
          taskId: task.id,
          status: 'already_in_sync'
        })
      }
    }

    console.log(`✅ Task-quotation sync completed. Updated ${updatedCount} tasks.`)

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updatedCount} tasks with quotation values`,
      updated: updatedCount,
      total_checked: tasksWithQuotations.length,
      details: updates
    })

  } catch (error: any) {
    console.error('❌ Error syncing task-quotation values:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to sync task-quotation values'
      },
      { status: 500 }
    )
  }
} 