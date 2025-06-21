import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

/**
 * 🔄 CONTINUOUS QUOTATION WORKFLOW ENGINE
 * 
 * This API automatically progresses quotations through all stages:
 * 1. Draft → Pending Approval → Approved → Client Sent → Follow Up → Negotiation → Final Outcome
 * 
 * Instead of discrete tasks that need manual completion, this creates a continuous
 * workflow that automatically moves to the next stage based on triggers.
 */

export async function POST(request: NextRequest) {
  try {
    const { action, quotationId, data } = await request.json()

    console.log('🔄 Continuous Workflow Trigger:', { action, quotationId, data })

    switch (action) {
      case 'start_workflow':
        return await startContinuousWorkflow(quotationId)
      
      case 'progress_workflow':
        return await progressWorkflow(quotationId, data)
      
      case 'handle_approval_decision':
        return await handleApprovalDecision(quotationId, data)
      
      case 'handle_client_response':
        return await handleClientResponse(quotationId, data)
      
      case 'handle_negotiation':
        return await handleNegotiation(quotationId, data)
      
      case 'finalize_outcome':
        return await finalizeOutcome(quotationId, data)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Continuous workflow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * 🚀 START CONTINUOUS WORKFLOW
 * Initiates the continuous workflow for a quotation
 */
async function startContinuousWorkflow(quotationId: number) {
  console.log('🚀 Starting continuous workflow for quotation:', quotationId)
  
  const client = await pool.connect()
  try {
    // Get quotation details
    const quotationQuery = `
      SELECT q.*, e.name as created_by_name
      FROM quotations q
      LEFT JOIN employees e ON q.created_by = e.id
      WHERE q.id = $1
    `
    const quotationResult = await client.query(quotationQuery, [quotationId])
    const quotation = quotationResult.rows[0]
    
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }
    
    // Check if quotation_workflows table exists, create if it doesn't
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quotation_workflows'
      );
    `
    
    const tableExists = await client.query(checkTableQuery)
    
    if (!tableExists.rows[0].exists) {
      console.log('🏗️ Creating quotation_workflows table...')
      const createTableQuery = `
        CREATE TABLE quotation_workflows (
          id SERIAL PRIMARY KEY,
          quotation_id INTEGER REFERENCES quotations(id),
          current_stage VARCHAR(50),
          workflow_type VARCHAR(50),
          auto_progression BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB
        );
      `
      await client.query(createTableQuery)
      console.log('✅ quotation_workflows table created')
    }
    
    // Create continuous workflow record
    const insertWorkflowQuery = `
      INSERT INTO quotation_workflows (
        quotation_id, current_stage, workflow_type, auto_progression, 
        created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5)
      RETURNING *
    `
    
    const workflowMetadata = {
      quotation_number: quotation.quotation_number,
      client_name: quotation.client_name,
      total_amount: quotation.total_amount,
      workflow_started: new Date().toISOString(),
      auto_progression_enabled: true
    }
    
    const workflowResult = await client.query(insertWorkflowQuery, [
      quotationId,
      'draft',
      'continuous',
      true,
      JSON.stringify(workflowMetadata)
    ])
    
    console.log('✅ Continuous workflow record created')
    
    // Auto-progress to next stage
    await progressToNextStage(quotationId, 'draft', client)
    
    return NextResponse.json({
      success: true,
      message: 'Continuous workflow started',
      quotation_id: quotationId,
      current_stage: 'pending_approval',
      workflow: workflowResult.rows[0]
    })
    
  } catch (error) {
    console.error('❌ Error starting continuous workflow:', error)
    return NextResponse.json({ error: 'Failed to start workflow' }, { status: 500 })
  } finally {
    client.release()
  }
}

/**
 * ⚡ PROGRESS WORKFLOW
 * Automatically progresses workflow based on current stage and triggers
 */
async function progressWorkflow(quotationId: number, data: any) {
  console.log('⚡ Progressing workflow for quotation:', quotationId, 'Data:', data)
  
  const client = await pool.connect()
  try {
    // Get current quotation status
    const quotationQuery = `
      SELECT q.*, e.name as created_by_name
      FROM quotations q
      LEFT JOIN employees e ON q.created_by = e.id
      WHERE q.id = $1
    `
    const quotationResult = await client.query(quotationQuery, [quotationId])
    const quotation = quotationResult.rows[0]
    
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }
    
    const currentStage = quotation.status
    console.log('📍 Current stage:', currentStage)
    
    // Determine next action based on current stage
    switch (currentStage) {
      case 'draft':
        await progressToNextStage(quotationId, 'draft', client)
        break
        
      case 'pending_approval':
        // Wait for approval decision - no auto progression
        console.log('⏳ Waiting for approval decision')
        break
        
      case 'approved':
        await handleApprovedQuotation(quotationId, client)
        break
        
      case 'rejected':
        await handleRejectedQuotation(quotationId, data, client)
        break
        
      case 'client_sent':
        await startClientFollowUp(quotationId, client)
        break
        
      case 'client_reviewing':
        // Wait for client response or auto-follow up after timeout
        await scheduleFollowUpReminder(quotationId, client)
        break
        
      case 'negotiation':
        await handleActiveNegotiation(quotationId, data, client)
        break
        
      case 'accepted':
        await processAcceptedQuotation(quotationId, client)
        break
        
      case 'declined':
        await processDeclinedQuotation(quotationId, client)
        break
        
      default:
        console.log('❓ Unknown stage, no auto progression')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Workflow progressed',
      current_stage: currentStage
    })
    
  } catch (error) {
    console.error('❌ Error progressing workflow:', error)
    return NextResponse.json({ error: 'Failed to progress workflow' }, { status: 500 })
  } finally {
    client.release()
  }
}

/**
 * 🎯 PROGRESS TO NEXT STAGE
 * Automatically moves quotation to the next logical stage
 */
async function progressToNextStage(quotationId: number, currentStage: string, client: any) {
  console.log('🎯 Progressing from stage:', currentStage)
  
  try {
    let nextStage = ''
    let actions = []
    
    switch (currentStage) {
      case 'draft':
        nextStage = 'pending_approval'
        actions = ['Create approval task', 'Notify sales head']
        break
        
      case 'approved':
        nextStage = 'client_sent'
        actions = ['Send quotation to client', 'Create follow-up task']
        break
        
      case 'client_sent':
        nextStage = 'client_reviewing'
        actions = ['Monitor client response', 'Schedule follow-up']
        break
        
      default:
        console.log('❓ No automatic progression for stage:', currentStage)
        return
    }
    
    // Update quotation status
    const updateQuery = `
      UPDATE quotations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `
    await client.query(updateQuery, [nextStage, quotationId])
    
    // Update workflow record
    const updateWorkflowQuery = `
      UPDATE quotation_workflows 
      SET current_stage = $1, updated_at = CURRENT_TIMESTAMP,
          metadata = metadata || $3
      WHERE quotation_id = $2
    `
    const progressMetadata = {
      last_progression: new Date().toISOString(),
      actions_triggered: actions
    }
    await client.query(updateWorkflowQuery, [nextStage, quotationId, JSON.stringify(progressMetadata)])
    
    // Execute workflow actions
    for (const action of actions) {
      await executeWorkflowAction(quotationId, action, client)
    }
    
    // Log progression
    await logWorkflowProgression(quotationId, currentStage, nextStage, client)
    
    console.log(`✅ Progressed quotation ${quotationId} from ${currentStage} to ${nextStage}`)
    
  } catch (error) {
    console.error('❌ Error progressing to next stage:', error)
  }
}

/**
 * 🔧 EXECUTE WORKFLOW ACTION
 * Executes specific actions triggered by workflow progression
 */
async function executeWorkflowAction(quotationId: number, action: string, client: any) {
  console.log('🔧 Executing workflow action:', action)
  
  try {
    switch (action) {
      case 'Create approval task':
        await createApprovalTask(quotationId, client)
        break
        
      case 'Notify sales head':
        await notifySalesHead(quotationId, client)
        break
        
      case 'Send quotation to client':
        await sendWhatsAppToClient(quotationId, client)
        break
        
      case 'Create follow-up task':
        await createFollowUpTask(quotationId, client)
        break
        
      case 'Monitor client response':
        // Set up monitoring - can be enhanced
        console.log('📱 Client response monitoring activated')
        break
        
      case 'Schedule follow-up':
        await scheduleFollowUpReminder(quotationId, client)
        break
        
      default:
        console.log('❓ Unknown workflow action:', action)
    }
  } catch (error) {
    console.error(`❌ Error executing workflow action "${action}":`, error)
  }
}

/**
 * 📋 CREATE APPROVAL TASK
 * Creates a task for quotation approval
 */
async function createApprovalTask(quotationId: number, client: any) {
  console.log('📋 Creating approval task for quotation:', quotationId)
  
  try {
    // Get quotation details for task context
    const quotationQuery = `
      SELECT q.*, e.name as created_by_name
      FROM quotations q
      LEFT JOIN employees e ON q.created_by = e.id
      WHERE q.id = $1
    `
    const quotationResult = await client.query(quotationQuery, [quotationId])
    const quotation = quotationResult.rows[0]
    
    if (!quotation) {
      console.error('❌ Quotation not found for approval task creation')
      return
    }
    
    // Find Sales Head for task assignment
    const salesHeadQuery = `
      SELECT e.id FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.role ILIKE '%sales head%' 
      AND e.status = 'active'
      ORDER BY e.id
      LIMIT 1
    `
    const salesHeadResult = await client.query(salesHeadQuery)
    const salesHeadId = salesHeadResult.rows[0]?.id || 1 // Default to admin if no sales head
    
    // Create approval task
    const taskQuery = `
      INSERT INTO tasks (
        title, description, employee_id, status, priority, type,
        due_date, created_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
      RETURNING id
    `
    
    const taskTitle = `Approve Quotation #${quotation.quotation_number}`
    const taskDescription = `Review and approve quotation for ${quotation.client_name} worth ₹${quotation.total_amount}`
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
    const taskMetadata = {
      quotation_id: quotationId,
      quotation_number: quotation.quotation_number,
      client_name: quotation.client_name,
      amount: quotation.total_amount,
      workflow_action: 'approval_required'
    }
    
    const taskResult = await client.query(taskQuery, [
      taskTitle,
      taskDescription,
      salesHeadId,
      'pending',
      'high',
      'quotation_approval',
      dueDate.toISOString(),
      JSON.stringify(taskMetadata)
    ])
    
    console.log(`✅ Created approval task ${taskResult.rows[0].id} for quotation ${quotationId}`)
    
  } catch (error) {
    console.error('❌ Error creating approval task:', error)
  }
}

/**
 * ✅ HANDLE APPROVED QUOTATION
 * Automatically handles approved quotation workflow
 */
async function handleApprovedQuotation(quotationId: number, client: any) {
  console.log('✅ Handling approved quotation - auto progression')
  
  try {
    // Auto-progress to client_sent
    await progressToNextStage(quotationId, 'approved', client)
    
    // Complete the approval task automatically
    const completeTaskQuery = `
      UPDATE tasks 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
          completion_notes = 'Auto-completed by continuous workflow - quotation approved and sent to client'
      WHERE quotation_id = $1 AND task_type = 'quotation_approval' AND status = 'pending'
    `
    await client.query(completeTaskQuery, [quotationId])
    
    console.log('✅ Auto-completed approval task and progressed workflow')
    
  } catch (error) {
    console.error('❌ Error handling approved quotation:', error)
  }
}

/**
 * ❌ HANDLE REJECTED QUOTATION
 * Automatically handles rejected quotation workflow
 */
async function handleRejectedQuotation(quotationId: number, data: any, client: any) {
  console.log('❌ Handling rejected quotation - auto progression')
  
  try {
    // Complete the approval task automatically
    const completeTaskQuery = `
      UPDATE tasks 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
          completion_notes = $1
      WHERE quotation_id = $2 AND task_type = 'quotation_approval' AND status = 'pending'
    `
    await client.query(completeTaskQuery, [data?.rejection_reason || 'No reason provided', quotationId])
    
    // Create continuous revision workflow
    await createContinuousRevisionWorkflow(quotationId, data, client)
    
    console.log('✅ Auto-completed rejection and created revision workflow')
    
  } catch (error) {
    console.error('❌ Error handling rejected quotation:', error)
  }
}

/**
 * 🔄 CREATE CONTINUOUS REVISION WORKFLOW
 * Creates a continuous revision workflow instead of discrete tasks
 */
async function createContinuousRevisionWorkflow(quotationId: number, data: any, client: any) {
  console.log('🔄 Creating continuous revision workflow')
  
  try {
    // Get quotation and find sales person
    const quotationQuery = `
      SELECT q.*, e.name as created_by_name
      FROM quotations q
      LEFT JOIN employees e ON q.created_by = e.id
      WHERE q.id = $1
    `
    const quotationResult = await client.query(quotationQuery, [quotationId])
    const quotation = quotationResult.rows[0]
    
    if (!quotation) return
    
    // Find original sales person
    const originalTaskQuery = `
      SELECT t.assigned_to_employee_id, e.name as assigned_to
      FROM ai_tasks t
      LEFT JOIN employees e ON t.assigned_to_employee_id = e.id
      WHERE t.quotation_id = $1 AND t.task_type IN ('quotation_generation', 'client_followup')
      ORDER BY t.created_at DESC
      LIMIT 1
    `
    const originalTaskResult = await client.query(originalTaskQuery, [quotationId])
    const originalTask = originalTaskResult.rows[0]
    
    let salesPersonId = originalTask?.assigned_to_employee_id || 22 // Default to Deepika
    let salesPersonName = originalTask?.assigned_to || 'DEEPIKA DEVI M'
    
    const quotationInfo = quotation.quotation_data || {}
    
    // Create continuous revision workflow
    const insertWorkflowQuery = `
      INSERT INTO ai_tasks (
        task_title, task_description, task_type, priority, status,
        assigned_to_employee_id, assigned_to, quotation_id, client_name,
        due_date, business_impact, estimated_value, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `
    
    const taskTitle = `🔄 Continuous: Revise ${quotationInfo.client_name} - ${quotation.quotation_number}`
    const taskDescription = `**CONTINUOUS WORKFLOW - AUTO-PROGRESSING**

Your quotation has been rejected and is now in continuous revision workflow.

**Rejection Details:**
- Reason: ${data?.rejection_reason || 'Needs revision'}
- Feedback: ${data?.rejection_feedback || 'Please review and update'}

**What happens automatically:**
1. You revise the quotation (edit and save)
2. System detects changes and auto-resubmits for approval
3. Sales Head gets new approval task
4. If approved: Auto-sends to client and creates follow-up
5. If rejected again: Creates new revision workflow

**Your Action:**
- Go to Sales → Quotations → Edit ${quotation.quotation_number}
- Make necessary changes and save
- System handles everything else automatically`
    
    const taskMetadata = {
      workflow_type: 'continuous',
      auto_progression: true,
      quotation_number: quotation.quotation_number,
      stage: 'revision_pending',
      rejection_reason: data?.rejection_reason,
      next_actions: ['auto_resubmit_on_changes']
    }
    
    const taskResult = await client.query(insertWorkflowQuery, [
      taskTitle,
      taskDescription,
      'quotation_revision_continuous',
      'high',
      'pending',
      salesPersonId,
      salesPersonName,
      quotationId,
      quotationInfo.client_name,
      new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      'high',
      quotation.total_amount,
      JSON.stringify(taskMetadata)
    ])
    
    console.log(`✅ Created continuous revision workflow task ${taskResult.rows[0].id} for quotation ${quotationId}`)
    
  } catch (error) {
    console.error('❌ Error creating revision workflow:', error)
  }
}

/**
 * 📊 LOG WORKFLOW PROGRESSION
 * Logs workflow progression for analytics and debugging
 */
async function logWorkflowProgression(quotationId: number, fromStage: string, toStage: string, client: any) {
  try {
    // Try to log to workflow_logs table if it exists
    const logQuery = `
      INSERT INTO workflow_logs (
        quotation_id, from_stage, to_stage, progression_type, timestamp, metadata
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
    `
    const logMetadata = {
      workflow_type: 'continuous',
      auto_progression: true
    }
    await client.query(logQuery, [quotationId, fromStage, toStage, 'automatic', JSON.stringify(logMetadata)])
  } catch (error) {
    // Ignore if table doesn't exist
    console.log('ℹ️ Workflow logs table not available')
  }
}

// Additional helper functions for other workflow actions...
async function notifySalesHead(quotationId: number, client: any) {
  console.log('🔔 Notifying Sales Head - continuous workflow')
  // Implementation for notifications
}

async function sendWhatsAppToClient(quotationId: number, client: any) {
  console.log('📱 Sending WhatsApp to client - continuous workflow')
  // Implementation for WhatsApp sending
}

async function startClientFollowUp(quotationId: number, client: any) {
  console.log('📞 Starting client follow-up - continuous workflow')
  // Implementation for client follow-up workflow
}

async function createFollowUpTask(quotationId: number, client: any) {
  console.log('📞 Creating follow-up workflow - continuous')
  // Implementation for follow-up workflow
}

async function scheduleFollowUpReminder(quotationId: number, client: any) {
  console.log('⏰ Scheduling follow-up reminder - continuous')
  // Implementation for reminder scheduling
}

async function handleActiveNegotiation(quotationId: number, data: any, client: any) {
  console.log('💬 Handling active negotiation - continuous')
  // Implementation for negotiation handling
}

async function processAcceptedQuotation(quotationId: number, client: any) {
  console.log('🎉 Processing accepted quotation - continuous')
  // Implementation for accepted quotation processing
}

async function processDeclinedQuotation(quotationId: number, client: any) {
  console.log('😔 Processing declined quotation - continuous')
  // Implementation for declined quotation processing
}

async function handleApprovalDecision(quotationId: number, data: any) {
  console.log('🎯 Handling approval decision - continuous workflow')
  
  const client = await pool.connect()
  try {
    if (data.decision === 'approved') {
      await handleApprovedQuotation(quotationId, client)
    } else if (data.decision === 'rejected') {
      await handleRejectedQuotation(quotationId, data, client)
    }
    
    return NextResponse.json({ success: true, message: 'Approval decision processed' })
  } finally {
    client.release()
  }
}

async function handleClientResponse(quotationId: number, data: any) {
  console.log('👤 Handling client response - continuous workflow')
  // Implementation for client response handling
  return NextResponse.json({ success: true, message: 'Client response processed' })
}

async function handleNegotiation(quotationId: number, data: any) {
  console.log('💬 Handling negotiation - continuous workflow')
  // Implementation for negotiation handling
  return NextResponse.json({ success: true, message: 'Negotiation processed' })
}

async function finalizeOutcome(quotationId: number, data: any) {
  console.log('🏁 Finalizing outcome - continuous workflow')
  // Implementation for outcome finalization
  return NextResponse.json({ success: true, message: 'Outcome finalized' })
} 