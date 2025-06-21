import { createClient } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🔄 SEQUENTIAL TASK PROGRESSION
 * ==============================
 * 
 * Creates the next task in the sequence when current task is completed.
 * This ensures only one active task per quotation at any time.
 */

export async function POST(request: NextRequest) {
  try {
    const { completedTaskId, quotationId, quotationNumber, clientName, totalAmount } = await request.json()

    console.log('🔄 Creating next sequential task for:', quotationNumber)

    const { query, transaction } = createClient()

    // Get the completed task to determine the next step
    const { data: completedTask, error: taskError } = await supabase
      .from('ai_tasks')
      .select('*')
      .eq('id', completedTaskId)
      .single()

    if (taskError || !completedTask) {
      throw new Error(`Completed task not found: ${taskError?.message}`)
    }

    const currentStep = completedTask.metadata?.sequence_step || 1
    const nextStep = currentStep + 1
    const totalSteps = completedTask.metadata?.sequence_total_steps || 6

    console.log(`📊 Current step: ${currentStep}, Next step: ${nextStep}, Total: ${totalSteps}`)

    // Check if we've reached the end of the sequence
    if (nextStep > totalSteps) {
      console.log('✅ Task sequence completed for:', quotationNumber)
      return NextResponse.json({
        success: true,
        sequenceCompleted: true,
        message: `Task sequence completed for ${quotationNumber}. No more follow-up tasks needed.`
      })
    }

    // Get the task sequence and find the next task
    const taskSequence = getTaskSequence(quotationNumber, clientName, totalAmount)
    const nextTaskTemplate = taskSequence.find(task => task.step === nextStep)

    if (!nextTaskTemplate) {
      throw new Error(`Next task template not found for step ${nextStep}`)
    }

    console.log('🎯 Creating next task:', nextTaskTemplate.title)

    // Create the next task
    const { data: nextTask, error: createError } = await supabase
      .from('ai_tasks')
      .insert({
        task_title: nextTaskTemplate.title,
        task_description: nextTaskTemplate.description,
        priority: nextTaskTemplate.priority,
        status: 'pending',
        due_date: nextTaskTemplate.dueDate,
        category: 'sales_followup',
        assigned_to: 'Sales Team',
        assigned_by: 'AI System',
        client_name: clientName,
        business_impact: nextTaskTemplate.business_impact,
        ai_reasoning: nextTaskTemplate.ai_reasoning,
        estimated_value: totalAmount,
        lead_id: completedTask.lead_id,
        quotation_id: quotationId,
        metadata: {
          quotation_number: quotationNumber,
          task_type: 'post_approval_followup',
          ai_generated: true,
          sequence_step: nextStep,
          total_amount: totalAmount,
          sequence_total_steps: totalSteps,
          is_sequential: true,
          previous_task_id: completedTaskId
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create next task: ${createError.message}`)
    }

    console.log('✅ Created next sequential task:', nextTaskTemplate.title)

    return NextResponse.json({
      success: true,
      nextTask: nextTask,
      currentStep: nextStep,
      totalSteps: totalSteps,
      quotationNumber,
      message: `Sequential task created: Step ${nextStep} of ${totalSteps} for ${quotationNumber}`
    })

  } catch (error) {
    console.error('❌ Sequential Task Creation Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create next sequential task',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

/**
 * 🧠 COMPLETE TASK SEQUENCE REFERENCE
 * ===================================
 * Full sequence for creating next tasks (duplicated from create-followup-sequence)
 */
function getTaskSequence(quotationNumber: string, clientName: string, totalAmount: number): any[] {
  const now = new Date()
  const isHighValue = totalAmount > 100000
  
  const tasks = [
    {
      step: 1,
      title: `📞 Initial Follow-up Call - ${quotationNumber}`,
      description: `Call ${clientName} to confirm quotation receipt and answer any initial questions. Quote: ${quotationNumber} (₹${totalAmount.toLocaleString()})`,
      priority: isHighValue ? 'high' : 'medium',
      dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      ai_reasoning: `🎯 SEQUENTIAL STEP 1 of 6: Critical first contact within 2 hours to confirm receipt and show proactive service.`,
      business_impact: `First Impression • Client Engagement • Value: ₹${totalAmount.toLocaleString()} • Step 1/6`
    },
    
    {
      step: 2,
      title: `💬 WhatsApp Check-in - ${quotationNumber}`,
      description: `Send WhatsApp message to ${clientName} asking if they have reviewed the quotation and if they need any clarifications.`,
      priority: 'medium',
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      ai_reasoning: `🎯 SEQUENTIAL STEP 2 of 6: WhatsApp follow-up provides convenient channel for client response. Non-intrusive but maintains engagement momentum.`,
      business_impact: `Client Convenience • Response Rate Increase • Relationship Building • Step 2/6`
    },
    
    {
      step: 3,
      title: `🎯 Detailed Discussion - ${quotationNumber}`,
      description: `Schedule detailed discussion with ${clientName} about services, deliverables, and timeline. Be prepared to modify quotation if needed.`,
      priority: isHighValue ? 'high' : 'medium',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      ai_reasoning: `🎯 SEQUENTIAL STEP 3 of 6: Detailed discussion captures optimal engagement window. Allows time for client consideration while maintaining sales momentum.`,
      business_impact: `Deal Refinement • Objection Handling • Closing Opportunity • Step 3/6`
    },
    
    {
      step: 4,
      title: `💰 Payment Discussion - ${quotationNumber}`,
      description: `Discuss payment terms and advance payment with ${clientName}. Total amount: ₹${totalAmount.toLocaleString()}`,
      priority: 'high',
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      ai_reasoning: `🎯 SEQUENTIAL STEP 4 of 6: Payment discussion indicates serious client interest. Critical conversion point for deal closure and cash flow initiation.`,
      business_impact: `Revenue Conversion • Cash Flow • Deal Closure • Value: ₹${totalAmount.toLocaleString()} • Step 4/6`
    },
    
    {
      step: 5,
      title: `📋 Final Follow-up - ${quotationNumber}`,
      description: `Final follow-up with ${clientName} to close the deal or understand rejection reasons. Update status accordingly.`,
      priority: isHighValue ? 'high' : 'medium',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ai_reasoning: `🎯 SEQUENTIAL STEP 5 of 6: Final follow-up to either close deal or understand rejection. Critical for pipeline management and learning from lost deals.`,
      business_impact: `Deal Closure • Pipeline Management • Learning • Customer Feedback • Step 5/6`
    }
  ]

  // 🚀 Add extra task for high-value quotations (becomes step 2)
  if (isHighValue) {
    tasks.splice(1, 0, {
      step: 2,
      title: `👥 Team Discussion - ${quotationNumber}`,
      description: `High-value quotation (₹${totalAmount.toLocaleString()}) - Discuss strategy with sales head for ${clientName}`,
      priority: 'high',
      dueDate: new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString(),
      ai_reasoning: `🎯 SEQUENTIAL STEP 2 of 6: High-value quotation requires strategic team consultation to maximize closure probability and ensure optimal pricing strategy.`,
      business_impact: `Strategic Planning • High-Value Deal • Revenue Optimization • Team Alignment • Step 2/6`
    })
    
    // Renumber subsequent steps
    for (let i = 2; i < tasks.length; i++) {
      tasks[i].step = i + 1
      tasks[i].ai_reasoning = tasks[i].ai_reasoning.replace(/STEP \d+ of 6/, `STEP ${i + 1} of 6`)
      tasks[i].business_impact = tasks[i].business_impact.replace(/Step \d+\/6/, `Step ${i + 1}/6`)
    }
  }

  return tasks
} 