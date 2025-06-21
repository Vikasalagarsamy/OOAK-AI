import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/postgresql-client'

export async function POST(request: NextRequest) {
  try {
    const { query, transaction } = createClient()
    
    console.log('🔄 Starting task type fix...')
    
    // Fix task_type for existing quotation approval tasks
    const { data: approvalUpdates, error: approvalError } = await supabase
      .from('ai_tasks')
      .update({ task_type: 'quotation_approval' })
      .or('task_title.ilike.%review%approval%,task_title.ilike.%approve%quotation%,task_title.ilike.%quotation%approval%')
      .select('id, task_title')

    if (approvalError) {
      console.error('Error updating approval tasks:', approvalError)
    } else {
      console.log(`✅ Updated ${approvalUpdates?.length || 0} approval tasks`)
    }

    // Also update any tasks that have quotation_id and are clearly approval tasks
    const { data: quotationUpdates, error: quotationError } = await supabase
      .from('ai_tasks')
      .update({ task_type: 'quotation_approval' })
      .not('quotation_id', 'is', null)
      .eq('status', 'pending')
      .or('assigned_to.ilike.%CTO%,assigned_to.ilike.%manager%,assigned_to.ilike.%head%')
      .select('id, task_title')

    if (quotationError) {
      console.error('Error updating quotation tasks:', quotationError)
    } else {
      console.log(`✅ Updated ${quotationUpdates?.length || 0} quotation approval tasks`)
    }

    // Mark original completed tasks as 'quotation_generation' instead
    const { data: generationUpdates, error: generationError } = await supabase
      .from('ai_tasks')
      .update({ task_type: 'quotation_generation' })
      .eq('status', 'completed')
      .not('quotation_id', 'is', null)
      .is('task_type', null)
      .select('id, task_title')

    if (generationError) {
      console.error('Error updating generation tasks:', generationError)
    } else {
      console.log(`✅ Updated ${generationUpdates?.length || 0} generation tasks`)
    }

    // Get verification data
    const { data: verificationData, error: verifyError } = await supabase
      .from('ai_tasks')
      .select('id, task_title, task_type, status, quotation_id, assigned_to')
      .not('quotation_id', 'is', null)
      .order('id')

    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`)
    }

    const totalUpdated = (approvalUpdates?.length || 0) + (quotationUpdates?.length || 0) + (generationUpdates?.length || 0)

    console.log(`✅ Task type fix completed. Updated ${totalUpdated} tasks.`)

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${totalUpdated} task types`,
      updates: {
        approval_tasks: approvalUpdates?.length || 0,
        quotation_tasks: quotationUpdates?.length || 0,
        generation_tasks: generationUpdates?.length || 0
      },
      verification: verificationData,
      summary: {
        quotation_approval_tasks: verificationData?.filter(t => t.task_type === 'quotation_approval').length || 0,
        quotation_generation_tasks: verificationData?.filter(t => t.task_type === 'quotation_generation').length || 0,
        untyped_tasks: verificationData?.filter(t => !t.task_type).length || 0
      }
    })

  } catch (error: any) {
    console.error('❌ Error fixing task types:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Failed to fix task types'
      },
      { status: 500 }
    )
  }
} 