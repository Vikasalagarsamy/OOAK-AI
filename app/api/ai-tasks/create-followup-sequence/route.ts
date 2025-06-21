import { createClient } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 🤖 AI FOLLOW-UP TASK SEQUENCE GENERATOR
 * ===========================================
 * 
 * Automatically creates intelligent follow-up tasks when quotations are approved.
 * This ensures no client is forgotten and proper business process is followed.
 */

export async function POST(request: NextRequest) {
  try {
    const { quotationId, quotationNumber, clientName, totalAmount, status, taskType } = await request.json()

    console.log('🤖 AI Task Generator: Creating follow-up sequence for:', quotationNumber)

    const { query, transaction } = createClient()

    // 🎯 SEQUENTIAL TASK CREATION - Create only the FIRST task
    const firstTask = generateFirstTask(quotationNumber, clientName, totalAmount)

    console.log('🎯 Creating FIRST task only:', firstTask.title)

    const { data: newTask, error } = await supabase
      .from('ai_tasks')
      .insert({
        task_title: firstTask.title,
        task_description: firstTask.description,
        priority: firstTask.priority,
        status: 'pending',
        due_date: firstTask.dueDate,
        category: 'sales_followup',
        assigned_to: 'Sales Team',
        assigned_by: 'AI System',
        // Store client details directly in columns the dashboard expects
        client_name: clientName,
        business_impact: firstTask.business_impact,
        ai_reasoning: firstTask.ai_reasoning,
        estimated_value: totalAmount,
        lead_id: null, // Will be populated if lead context is available
        quotation_id: quotationId,
        metadata: {
          quotation_number: quotationNumber,
          task_type: taskType,
          ai_generated: true,
          sequence_step: firstTask.step,
          total_amount: totalAmount,
          sequence_total_steps: 6, // Total steps in the sequence
          is_sequential: true // Flag to identify sequential tasks
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    const createdTasks = []
    if (error) {
      console.error('❌ Error creating first task:', firstTask.title, error)
    } else {
      createdTasks.push(newTask)
      console.log('✅ Created first task:', firstTask.title)
    }

    // 📊 LOG SUCCESS METRICS
    console.log(`🎯 Sequential Task Generator: Created FIRST task (${createdTasks.length}) for ${quotationNumber}`)

    return NextResponse.json({
      success: true,
      tasksCreated: createdTasks.length,
      tasks: createdTasks,
      quotationNumber,
      isSequential: true,
      currentStep: 1,
      totalSteps: 6,
      message: `Sequential AI task created: Step 1 of 6 for ${quotationNumber}. Next task will be auto-created upon completion.`
    })

  } catch (error) {
    console.error('❌ AI Task Generator Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create AI follow-up tasks',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

/**
 * 🎯 SEQUENTIAL TASK GENERATOR - FIRST TASK ONLY
 * ===============================================
 * Creates only the first task in the follow-up sequence.
 * Next tasks are created automatically when the current one is completed.
 */
function generateFirstTask(quotationNumber: string, clientName: string, totalAmount: number): any {
  const now = new Date()
  const isHighValue = totalAmount > 100000
  
  // Always return the first task only
  return {
    step: 1,
    title: `📞 Initial Follow-up Call - ${quotationNumber}`,
    description: `Call ${clientName} to confirm quotation receipt and answer any initial questions. Quote: ${quotationNumber} (₹${totalAmount.toLocaleString()})`,
    priority: isHighValue ? 'high' : 'medium',
    dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    ai_reasoning: `🎯 SEQUENTIAL STEP 1 of 6: Critical first contact within 2 hours to confirm receipt and show proactive service. ${isHighValue ? 'High-value client requires immediate attention.' : 'Standard follow-up protocol.'} Next task will be auto-created upon completion.`,
    business_impact: `First Impression • Client Engagement • Value: ₹${totalAmount.toLocaleString()} • Step 1/6`
  }
}

/**
 * 🧠 COMPLETE TASK SEQUENCE REFERENCE
 * ===================================
 * Full sequence for reference (used when creating next tasks)
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

  // 🚀 Add extra task for high-value quotations (becomes step 2.5)
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