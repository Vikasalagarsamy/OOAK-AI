import { query, transaction } from '@/lib/postgresql-client'

/**
 * 🔄 CONTINUOUS WORKFLOW SERVICE
 * 
 * This service transforms the discrete task-based workflow into a continuous
 * workflow that automatically progresses quotations through all stages until
 * final outcome (accepted/rejected).
 */

export class ContinuousWorkflowService {

  /**
   * 🚀 START CONTINUOUS WORKFLOW
   * Initiates continuous workflow for a quotation
   */
  async startWorkflow(quotationId: number) {
    console.log('🚀 Starting continuous workflow for quotation:', quotationId)
    
    try {
      // Get quotation details
      const quotationResult = await query(
        'SELECT * FROM quotations WHERE id = $1',
        [quotationId]
      )
      
      if (!quotationResult.rows || quotationResult.rows.length === 0) {
        throw new Error('Quotation not found')
      }
      
      const quotation = quotationResult.rows[0]
      
      // Mark quotation as continuous workflow
      await query(
        `UPDATE quotations 
         SET workflow_status = $1, 
             metadata = $2
         WHERE id = $3`,
        [
          'continuous_workflow',
          JSON.stringify({
            ...quotation.metadata,
            continuous_workflow: true,
            workflow_started: new Date().toISOString(),
            auto_progression: true
          }),
          quotationId
        ]
      )
      
      // Start the workflow progression
      await this.progressWorkflow(quotationId)
      
      return { success: true, message: 'Continuous workflow started' }
      
    } catch (error) {
      console.error('❌ Error starting continuous workflow:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * ⚡ PROGRESS WORKFLOW
   * Automatically progresses workflow based on current state
   */
  async progressWorkflow(quotationId: number) {
    console.log('⚡ Progressing continuous workflow for quotation:', quotationId)
    
    try {
      const { data: quotation } = await query(
        'SELECT * FROM quotations WHERE id = $1',
        [quotationId]
      )
      
      if (!quotation) return
      
      const currentStage = quotation.status
      console.log('📍 Current stage:', currentStage)
      
      switch (currentStage) {
        case 'draft':
          await this.handleDraftStage(quotationId)
          break
          
        case 'pending_approval':
          await this.handlePendingApprovalStage(quotationId)
          break
          
        case 'approved':
          await this.handleApprovedStage(quotationId)
          break
          
        case 'rejected':
          await this.handleRejectedStage(quotationId)
          break
          
        case 'client_sent':
          await this.handleClientSentStage(quotationId)
          break
          
        case 'client_reviewing':
          await this.handleClientReviewingStage(quotationId)
          break
          
        case 'negotiation':
          await this.handleNegotiationStage(quotationId)
          break
          
        case 'accepted':
          await this.handleAcceptedStage(quotationId)
          break
          
        case 'declined':
          await this.handleDeclinedStage(quotationId)
          break
          
        default:
          console.log('❓ Unknown stage, no auto progression:', currentStage)
      }
      
    } catch (error) {
      console.error('❌ Error progressing workflow:', error)
    }
  }

  /**
   * 📝 HANDLE DRAFT STAGE
   * Auto-submit for approval when quotation is complete
   */
  async handleDraftStage(quotationId: number) {
    console.log('📝 Handling draft stage - auto-submitting for approval')
    
    try {
      // Update status to pending approval
      await query(
        `UPDATE quotations 
         SET status = $1, 
             workflow_status = $2, 
             updated_at = $3
         WHERE id = $4`,
        [
          'pending_approval',
          'pending_approval',
          new Date().toISOString(),
          quotationId
        ]
      )
      
      // Create approval record
      await query(
        `INSERT INTO quotation_approvals (quotation_id, approval_status, comments, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          quotationId,
          'pending',
          'Auto-submitted by continuous workflow',
          new Date().toISOString(),
          new Date().toISOString()
        ]
      )
      
      // Create continuous approval task
      await this.createContinuousApprovalTask(quotationId)
      
      console.log('✅ Auto-submitted for approval')
      
    } catch (error) {
      console.error('❌ Error handling draft stage:', error)
    }
  }

  /**
   * ⏳ HANDLE PENDING APPROVAL STAGE
   * Wait for approval decision, then auto-progress
   */
  async handlePendingApprovalStage(quotationId: number) {
    console.log('⏳ Handling pending approval stage - waiting for decision')
    
    // Check if approval decision has been made
    const { data: latestApproval } = await query(
      'SELECT * FROM quotation_approvals WHERE quotation_id = $1 ORDER BY created_at DESC LIMIT 1',
      [quotationId]
    )
    
    if (latestApproval) {
      if (latestApproval.approval_status === 'approved') {
        await this.handleApprovalDecision(quotationId, 'approved', latestApproval.comments)
      } else if (latestApproval.approval_status === 'rejected') {
        await this.handleApprovalDecision(quotationId, 'rejected', latestApproval.comments)
      }
    }
  }

  /**
   * 🎯 HANDLE APPROVAL DECISION
   * Auto-progress based on approval decision
   */
  async handleApprovalDecision(quotationId: number, decision: string, comments: string) {
    console.log('🎯 Handling approval decision:', decision)
    
    try {
      if (decision === 'approved') {
        // Update quotation status
        await query(
          `UPDATE quotations 
           SET status = $1, 
               workflow_status = $2, 
               updated_at = $3
           WHERE id = $4`,
          [
            'approved',
            'approved',
            new Date().toISOString(),
            quotationId
          ]
        )
        
        // Auto-complete approval task
        await this.autoCompleteTask(quotationId, 'quotation_approval', 'Auto-completed: Quotation approved by continuous workflow')
        
        // Auto-progress to next stage
        await this.handleApprovedStage(quotationId)
        
      } else if (decision === 'rejected') {
        // Update quotation status
        await query(
          `UPDATE quotations 
           SET status = $1, 
               workflow_status = $2, 
               updated_at = $3
           WHERE id = $4`,
          [
            'rejected',
            'rejected',
            new Date().toISOString(),
            quotationId
          ]
        )
        
        // Auto-complete approval task
        await this.autoCompleteTask(quotationId, 'quotation_approval', `Auto-completed: Quotation rejected - ${comments}`)
        
        // Auto-progress to revision workflow
        await this.handleRejectedStage(quotationId)
      }
      
    } catch (error) {
      console.error('❌ Error handling approval decision:', error)
    }
  }

  /**
   * ✅ HANDLE APPROVED STAGE
   * Auto-send to client and create follow-up workflow
   */
  async handleApprovedStage(quotationId: number) {
    console.log('✅ Handling approved stage - auto-sending to client')
    
    try {
      // Send WhatsApp to client (call existing API)
      await this.sendWhatsAppToClient(quotationId)
      
      // Update status to client_sent
      await query(
        `UPDATE quotations 
         SET status = $1, 
             workflow_status = $2, 
             updated_at = $3
         WHERE id = $4`,
        [
          'client_sent',
          'client_sent',
          new Date().toISOString(),
          quotationId
        ]
      )
      
      // Create continuous follow-up workflow
      await this.createContinuousFollowUpWorkflow(quotationId)
      
      // Auto-progress to client reviewing
      setTimeout(() => {
        this.handleClientSentStage(quotationId)
      }, 5000) // 5 second delay
      
      console.log('✅ Auto-sent to client and created follow-up workflow')
      
    } catch (error) {
      console.error('❌ Error handling approved stage:', error)
    }
  }

  /**
   * ❌ HANDLE REJECTED STAGE
   * Auto-create revision workflow
   */
  async handleRejectedStage(quotationId: number) {
    console.log('❌ Handling rejected stage - auto-creating revision workflow')
    
    try {
      // Create continuous revision workflow
      await this.createContinuousRevisionWorkflow(quotationId)
      
      console.log('✅ Auto-created revision workflow')
      
    } catch (error) {
      console.error('❌ Error handling rejected stage:', error)
    }
  }

  /**
   * 📱 HANDLE CLIENT SENT STAGE
   * Auto-progress to client reviewing
   */
  async handleClientSentStage(quotationId: number) {
    console.log('📱 Handling client sent stage - auto-progressing to reviewing')
    
    try {
      // Update status to client_reviewing
      await query(
        `UPDATE quotations 
         SET status = $1, 
             workflow_status = $2, 
             updated_at = $3
         WHERE id = $4`,
        [
          'client_reviewing',
          'client_reviewing',
          new Date().toISOString(),
          quotationId
        ]
      )
      
      // Schedule follow-up reminders
      await this.scheduleFollowUpReminders(quotationId)
      
      console.log('✅ Auto-progressed to client reviewing')
      
    } catch (error) {
      console.error('❌ Error handling client sent stage:', error)
    }
  }

  /**
   * 👀 HANDLE CLIENT REVIEWING STAGE
   * Monitor for client response or timeout
   */
  async handleClientReviewingStage(quotationId: number) {
    console.log('👀 Handling client reviewing stage - monitoring for response')
    
    // This would typically be triggered by external events:
    // - Client WhatsApp response
    // - Client email response
    // - Follow-up call results
    // - Timeout for automatic follow-up
  }

  /**
   * 📋 CREATE CONTINUOUS APPROVAL TASK
   * Creates approval task with continuous workflow context
   */
  async createContinuousApprovalTask(quotationId: number) {
    console.log('📋 Creating continuous approval task')
    
    try {
      const { data: quotation } = await query(
        'SELECT * FROM quotations WHERE id = $1',
        [quotationId]
      )
      
      if (!quotation) return
      
      const { data: salesHead } = await query(
        'SELECT id, first_name, last_name FROM employees WHERE job_title ILIKE $1 LIMIT 1',
        ['%sales head%']
      )
      
      if (!salesHead) return
      
      const quotationInfo = quotation.quotation_data || {}
      
      await query(
        `INSERT INTO ai_tasks (task_title, task_description, task_type, priority, status, assigned_to_employee_id, assigned_to, quotation_id, client_name, due_date, business_impact, estimated_value, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          `🔄 Continuous: Review ${quotationInfo.client_name} - ${quotation.quotation_number}`,
          `**CONTINUOUS WORKFLOW - AUTO-PROGRESSING**

This quotation is in a continuous workflow. Your approval/rejection will automatically trigger the next steps:

✅ **If APPROVED:**
- WhatsApp sent to client automatically
- Follow-up workflow created for sales team
- Client response monitoring begins

❌ **If REJECTED:**
- Revision workflow created for sales person
- Auto-resubmission when changes are made

**Quotation Details:**
- Client: ${quotationInfo.client_name}
- Amount: ₹${quotation.total_amount?.toLocaleString()}
- Package: ${quotationInfo.default_package || 'Custom'}

**Action Required:**
Review and approve/reject in the Approval Queue. System handles everything else automatically.`,
          'quotation_approval_continuous',
          'high',
          'pending',
          salesHead.id,
          `${salesHead.first_name} ${salesHead.last_name}`.trim(),
          quotationId,
          quotationInfo.client_name,
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          quotation.total_amount > 100000 ? 'high' : 'medium',
          quotation.total_amount,
          JSON.stringify({
            workflow_type: 'continuous',
            auto_progression: true,
            quotation_number: quotation.quotation_number
          })
        ]
      )
      
      console.log('✅ Created continuous approval task')
      
    } catch (error) {
      console.error('❌ Error creating continuous approval task:', error)
    }
  }

  /**
   * 🔄 CREATE CONTINUOUS REVISION WORKFLOW
   */
  async createContinuousRevisionWorkflow(quotationId: number) {
    console.log('🔄 Creating continuous revision workflow')
    
    try {
      const { data: quotation } = await query(
        'SELECT * FROM quotations WHERE id = $1',
        [quotationId]
      )
      
      if (!quotation) return
      
      // Find original sales person
      const { data: originalTask } = await query(
        'SELECT assigned_to_employee_id, assigned_to FROM ai_tasks WHERE quotation_id = $1 AND task_type IN ($2, $3) ORDER BY created_at DESC LIMIT 1',
        [quotationId, 'quotation_generation', 'client_followup']
      )
      
      const salesPersonId = originalTask?.assigned_to_employee_id || 22
      const salesPersonName = originalTask?.assigned_to || 'DEEPIKA DEVI M'
      const quotationInfo = quotation.quotation_data || {}
      
      await query(
        `INSERT INTO ai_tasks (task_title, task_description, task_type, priority, status, assigned_to_employee_id, assigned_to, quotation_id, client_name, due_date, business_impact, estimated_value, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          `🔄 Continuous: Revise ${quotationInfo.client_name} - ${quotation.quotation_number}`,
          `**CONTINUOUS WORKFLOW - AUTO-PROGRESSING**

Your quotation has been rejected and is now in continuous revision workflow.

**What happens automatically:**
1. You revise the quotation (edit and save)
2. System detects changes and auto-resubmits for approval
3. Sales Head gets new approval task automatically
4. If approved: Auto-sends to client and creates follow-up
5. If rejected again: Creates new revision workflow

**Your Action:**
- Go to Sales → Quotations → Edit ${quotation.quotation_number}
- Make necessary changes and save
- System handles everything else automatically

**No need to manually complete this task - it auto-completes when you save changes!**`,
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
          JSON.stringify({
            workflow_type: 'continuous',
            auto_progression: true,
            quotation_number: quotation.quotation_number,
            auto_complete_on_edit: true
          })
        ]
      )
      
      console.log('✅ Created continuous revision workflow')
      
    } catch (error) {
      console.error('❌ Error creating continuous revision workflow:', error)
    }
  }

  /**
   * 📞 CREATE CONTINUOUS FOLLOW-UP WORKFLOW
   */
  async createContinuousFollowUpWorkflow(quotationId: number) {
    console.log('📞 Creating continuous follow-up workflow')
    
    try {
      const { data: quotation } = await query(
        'SELECT * FROM quotations WHERE id = $1',
        [quotationId]
      )
      
      if (!quotation) return
      
      // Find original sales person
      const { data: originalTask } = await query(
        'SELECT assigned_to_employee_id, assigned_to FROM ai_tasks WHERE quotation_id = $1 AND task_type IN ($2, $3) ORDER BY created_at DESC LIMIT 1',
        [quotationId, 'quotation_generation', 'client_followup']
      )
      
      const salesPersonId = originalTask?.assigned_to_employee_id || 22
      const salesPersonName = originalTask?.assigned_to || 'DEEPIKA DEVI M'
      const quotationInfo = quotation.quotation_data || {}
      
      await query(
        `INSERT INTO ai_tasks (task_title, task_description, task_type, priority, status, assigned_to_employee_id, assigned_to, quotation_id, client_name, due_date, business_impact, estimated_value, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          `🔄 Continuous: Follow up ${quotationInfo.client_name} - ${quotation.quotation_number}`,
          `**CONTINUOUS WORKFLOW - AUTO-PROGRESSING**

Quotation has been sent to client via WhatsApp. This is a continuous follow-up workflow.

**What happens automatically:**
- System monitors for client response
- Auto-schedules follow-up reminders
- Tracks client engagement
- Updates quotation status based on client actions

**Your Actions (as needed):**
- Call client to discuss quotation
- Handle any questions or negotiations
- Update quotation if client requests changes
- Mark final outcome (accepted/declined)

**System will auto-progress based on client response and your updates!**`,
          'client_followup_continuous',
          'high',
          'pending',
          salesPersonId,
          salesPersonName,
          quotationId,
          quotationInfo.client_name,
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          quotation.total_amount > 100000 ? 'high' : 'medium',
          quotation.total_amount,
          JSON.stringify({
            workflow_type: 'continuous',
            auto_progression: true,
            quotation_number: quotation.quotation_number,
            client_response_monitoring: true
          })
        ]
      )
      
      console.log('✅ Created continuous follow-up workflow')
      
    } catch (error) {
      console.error('❌ Error creating continuous follow-up workflow:', error)
    }
  }

  /**
   * ✅ AUTO-COMPLETE TASK
   * Automatically completes tasks when workflow progresses
   */
  async autoCompleteTask(quotationId: number, taskType: string, completionNotes: string) {
    console.log('✅ Auto-completing task:', taskType)
    
    try {
      await query(
        `UPDATE ai_tasks 
         SET status = $1, 
             completed_at = $2, 
             completion_notes = $3
         WHERE quotation_id = $4 AND task_type = $5 AND status = $6`,
        [
          'completed',
          new Date().toISOString(),
          completionNotes,
          quotationId,
          taskType,
          'pending'
        ]
      )
      
      console.log('✅ Auto-completed task:', taskType)
      
    } catch (error) {
      console.error('❌ Error auto-completing task:', error)
    }
  }

  /**
   * 📱 SEND WHATSAPP TO CLIENT
   * Calls existing WhatsApp API
   */
  async sendWhatsAppToClient(quotationId: number) {
    console.log('📱 Sending WhatsApp to client')
    
    try {
      const { data: quotation } = await query(
        'SELECT * FROM quotations WHERE id = $1',
        [quotationId]
      )
      
      if (!quotation) return
      
      // Call existing WhatsApp API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/quotation-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: quotationId,
          action: 'send_whatsapp'
        })
      })
      
      if (response.ok) {
        console.log('✅ WhatsApp sent to client')
      } else {
        console.error('❌ Failed to send WhatsApp')
      }
      
    } catch (error) {
      console.error('❌ Error sending WhatsApp:', error)
    }
  }

  /**
   * ⏰ SCHEDULE FOLLOW-UP REMINDERS
   */
  async scheduleFollowUpReminders(quotationId: number) {
    console.log('⏰ Scheduling follow-up reminders')
    
    // Implementation for scheduling reminders
    // This could integrate with a job queue or scheduling system
  }

  // Additional methods for other workflow stages...
  async handleNegotiationStage(quotationId: number) {
    console.log('💬 Handling negotiation stage')
  }

  async handleAcceptedStage(quotationId: number) {
    console.log('🎉 Handling accepted stage')
  }

  async handleDeclinedStage(quotationId: number) {
    console.log('😔 Handling declined stage')
  }
}

// Export singleton instance
export const continuousWorkflow = new ContinuousWorkflowService() 