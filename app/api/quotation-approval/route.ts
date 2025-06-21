import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import jwt from 'jsonwebtoken'

// PostgreSQL connection pool
// Using centralized PostgreSQL client

// Get authenticated user with employee details
async function getAuthenticatedUser() {
  try {
    // For development, use Durga Devi (Sales Head) as default
    console.log('🔐 Using Durga Devi (Sales Head) for quotation approval')
    
    const client = await pool.connect()
    
    try {
      const { rows } = await client.query(`
        SELECT 
          e.*,
          d.name as department_name,
          r.name as role_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN roles r ON e.role_id = r.id
        WHERE e.id = $1
      `, [7]) // Durga Devi's ID
      
      if (rows.length > 0) {
        const employee = rows[0]
        console.log('✅ Authenticated user found:', employee.first_name, employee.last_name, '-', employee.role_name)
        
        // Create mock user object for compatibility
        const user = {
          id: "7",
          email: employee.email,
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
          role: "authenticated",
        }
        
        return { user, employee }
      }
      
      console.error('❌ No valid employee found for authentication')
      return { user: null, employee: null }
      
    } finally {
      client.release()
    }
    
  } catch (authError) {
    console.error('❌ Auth error:', authError)
    return { user: null, employee: null }
  }
}

// WhatsApp notification for approved quotations
async function sendApprovalWhatsAppNotification(quotationNumber: string) {
  try {
    console.log('📱 Sending WhatsApp approval notification for:', quotationNumber)
    
    const client = await pool.connect()
    
    try {
      // Get quotation details for WhatsApp
      const { rows } = await client.query(`
        SELECT 
          id,
          quotation_number,
          total_amount,
          client_name,
          mobile,
          whatsapp,
          quotation_data,
          created_at
        FROM quotations 
        WHERE quotation_number = $1
      `, [quotationNumber])

      if (rows.length === 0) {
        console.error('❌ Failed to get quotation data for WhatsApp - quotation not found')
        return
      }

      const quotationData = rows[0]

      // Get phone number from whatsapp field or mobile field
      const clientPhone = quotationData.whatsapp || quotationData.mobile || "+919677362524"
      const cleanPhone = clientPhone.replace('+91', '').replace(/\D/g, '')
      
      console.log('📱 Sending WhatsApp to:', clientPhone, '→', cleanPhone)
      
      // Use the existing send-quotation-whatsapp API
      const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-quotation-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotationId: quotationData.id,
          clientWhatsApp: clientPhone,
          amount: quotationData.total_amount,
          clientName: quotationData.client_name,
          salesPerson: 'TEAM OOAK'
        })
      })

      if (whatsappResponse.ok) {
        const result = await whatsappResponse.json()
        console.log('✅ WhatsApp approval notification sent successfully:', result.messageId)
        
        // 🚀 NEW: AUTO-CREATE AI FOLLOW-UP TASKS
        await createPostApprovalTasks(quotationData.id, 'approved', quotationData)
        
      } else {
        const errorText = await whatsappResponse.text()
        console.error('❌ Failed to send WhatsApp approval notification:', errorText)
      }
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error sending WhatsApp approval notification:', error)
  }
}

// Rejection notification to sales resource
async function sendRejectionNotification(quotationNumber: string, rejectionComments: string) {
  try {
    console.log('📧 Sending rejection notification for:', quotationNumber)
    
    const client = await pool.connect()
    
    try {
      // Get quotation details
      const { rows } = await client.query(`
        SELECT 
          quotation_number,
          quotation_data,
          created_by,
          client_name,
          total_amount
        FROM quotations 
        WHERE quotation_number = $1
      `, [quotationNumber])

      if (rows.length === 0) {
        console.error('❌ Failed to get quotation data for rejection notification - quotation not found')
        return
      }

      const quotationData = rows[0]

      // Log rejection details for audit trail
      console.log('📝 Quotation Rejected:', {
        quotationNumber,
        rejectionComments,
        clientName: quotationData.client_name,
        amount: quotationData.total_amount,
        createdBy: quotationData.created_by,
        timestamp: new Date().toISOString()
      })

      // TODO: Implement email notification to sales resource
      // TODO: Create internal notification/alert system
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error sending rejection notification:', error)
  }
}

// Trigger rejection workflow
async function triggerRejectionWorkflow(quotationNumber: string, rejectionComments: string) {
  try {
    console.log('🔄 Triggering rejection workflow for:', quotationNumber)
    
    const response = await fetch('http://localhost:3000/api/quotation-rejection-workflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'notify_rejection',
        quotationNumber,
        rejectionDetails: {
          reason: rejectionComments || 'Quotation rejected by sales head',
          feedback: 'Please revise the quotation and resubmit for approval.',
          timestamp: new Date().toISOString()
        }
      })
    })

    if (response.ok) {
      console.log('✅ Rejection workflow triggered successfully')
    } else {
      console.error('❌ Failed to trigger rejection workflow:', await response.text())
    }
  } catch (error) {
    console.error('❌ Error triggering rejection workflow:', error)
  }
}

/**
 * 🤖 AI-POWERED POST-APPROVAL TASK CREATION
 * Creates intelligent follow-up tasks when quotation is approved
 */
async function createPostApprovalTasks(quotationId: number, status: string, quotationData: any) {
  try {
    console.log('🤖 Creating AI follow-up tasks for quotation:', quotationId)
    
    const taskCreationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-tasks/create-followup-sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quotationId,
        status,
        quotationData,
        context: 'post_approval'
      })
    })

    if (taskCreationResponse.ok) {
      const result = await taskCreationResponse.json()
      console.log('✅ AI follow-up tasks created successfully:', result.tasksCreated || 'unknown count')
    } else {
      console.error('❌ Failed to create AI follow-up tasks:', await taskCreationResponse.text())
    }
    
  } catch (error) {
    console.error('❌ Error creating AI follow-up tasks:', error)
  }
}

// Create post-approval follow-up task
async function createPostApprovalFollowUpTask(quotationId: number, quotation: any) {
  try {
    console.log('📋 Creating post-approval follow-up task for quotation:', quotation.quotation_number)
    
    const client = await pool.connect()
    
    try {
      // Get sales employee for task assignment
      const assigneeQuery = await client.query(`
        SELECT id, first_name, last_name, email
        FROM employees 
        WHERE role_id = (SELECT id FROM roles WHERE name ILIKE '%sales%')
        ORDER BY id ASC
        LIMIT 1
      `)
      
      const assigneeId = assigneeQuery.rows.length > 0 ? assigneeQuery.rows[0].id : 7 // Default to Durga Devi
      
      // Create comprehensive follow-up task
      const taskResult = await client.query(`
        INSERT INTO tasks (
          title,
          description,
          task_type,
          priority,
          status,
          assigned_to,
          quotation_id,
          due_date,
          created_at,
          updated_at,
          metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING id
      `, [
        `Follow up on approved quotation ${quotation.quotation_number}`,
        `CLIENT: ${quotation.client_name}
AMOUNT: ₹${quotation.total_amount?.toLocaleString() || 'TBD'}
STATUS: Quotation approved - initiate client follow-up

ACTION REQUIRED:
• Contact client within 24 hours to confirm receipt
• Discuss project timeline and next steps
• Gather advance payment (if applicable)
• Schedule project kickoff meeting
• Update client on delivery timeline

PRIORITY: High - Recently approved quotation requires immediate attention`,
        'followup',
        'high',
        'open',
        assigneeId,
        quotationId,
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        new Date(),
        new Date(),
        JSON.stringify({
          quotation_number: quotation.quotation_number,
          client_name: quotation.client_name,
          approval_date: new Date().toISOString(),
          auto_generated: true,
          context: 'post_approval'
        })
      ])
      
      console.log('✅ Post-approval follow-up task created with ID:', taskResult.rows[0].id)
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error creating post-approval follow-up task:', error)
    throw error
  }
}

// Complete approval tasks
async function completeApprovalTasks(quotationId: number) {
  try {
    console.log('✅ Completing approval tasks for quotation:', quotationId)
    
    const client = await pool.connect()
    
    try {
      // Find and complete pending approval tasks
      const { rows } = await client.query(`
        SELECT id, title 
        FROM tasks 
        WHERE quotation_id = $1 
        AND task_type = 'approval' 
        AND status = 'open'
      `, [quotationId])
      
      if (rows.length > 0) {
        // Update all approval tasks to completed
        await client.query(`
          UPDATE tasks 
          SET 
            status = 'completed',
            completed_at = $1,
            updated_at = $1
          WHERE quotation_id = $2 
          AND task_type = 'approval' 
          AND status = 'open'
        `, [new Date(), quotationId])
        
        console.log(`✅ Completed ${rows.length} approval task(s) for quotation ${quotationId}`)
      } else {
        console.log('ℹ️ No pending approval tasks found for quotation:', quotationId)
      }
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error completing approval tasks:', error)
  }
}

// Initialize business lifecycle tracking
async function initializeBusinessLifecycle(quotationId: number, quotation: any) {
  try {
    console.log('📊 Initializing business lifecycle for quotation:', quotation.quotation_number)
    
    const client = await pool.connect()
    
    try {
      const lifecycleData = {
        quotation_id: quotationId,
        current_stage: 'follow_up_active',
        stage_history: JSON.stringify([{
          stage: 'quotation_sent',
          timestamp: quotation.created_at,
          notes: 'Quotation initially created'
        }, {
          stage: 'follow_up_active', 
          timestamp: new Date().toISOString(),
          notes: 'Quotation approved, follow-up phase started'
        }]),
        probability_score: 75, // Initial optimistic score after approval
        last_client_interaction: new Date().toISOString(),
        next_follow_up_due: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        days_in_pipeline: 0,
        revision_count: 0,
        ai_insights: 'Quotation recently approved. Initial follow-up phase to monitor client engagement and ensure successful conversion.'
      }
      
      // Check if table exists and create if necessary
      await client.query(`
        CREATE TABLE IF NOT EXISTS quotation_business_lifecycle (
          id SERIAL PRIMARY KEY,
          quotation_id INTEGER REFERENCES quotations(id),
          current_stage VARCHAR(50),
          stage_history JSONB,
          probability_score INTEGER,
          last_client_interaction TIMESTAMPTZ,
          next_follow_up_due TIMESTAMPTZ,
          days_in_pipeline INTEGER DEFAULT 0,
          revision_count INTEGER DEFAULT 0,
          ai_insights TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(quotation_id)
        )
      `)
      
      // Insert or update lifecycle data
      await client.query(`
        INSERT INTO quotation_business_lifecycle (
          quotation_id, current_stage, stage_history, probability_score,
          last_client_interaction, next_follow_up_due, days_in_pipeline,
          revision_count, ai_insights
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (quotation_id) DO UPDATE SET
          current_stage = EXCLUDED.current_stage,
          stage_history = EXCLUDED.stage_history,
          probability_score = EXCLUDED.probability_score,
          last_client_interaction = EXCLUDED.last_client_interaction,
          next_follow_up_due = EXCLUDED.next_follow_up_due,
          updated_at = NOW()
      `, [
        lifecycleData.quotation_id,
        lifecycleData.current_stage,
        lifecycleData.stage_history,
        lifecycleData.probability_score,
        lifecycleData.last_client_interaction,
        lifecycleData.next_follow_up_due,
        lifecycleData.days_in_pipeline,
        lifecycleData.revision_count,
        lifecycleData.ai_insights
      ])
      
      console.log('✅ Business lifecycle tracking initialized successfully')
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error initializing business lifecycle:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { quotationId, action, comments } = await request.json()

    if (!quotationId || !action) {
      return NextResponse.json(
        { error: 'Quotation ID and action are required' },
        { status: 400 }
      )
    }

    const { user, employee } = await getAuthenticatedUser()
    
    if (!user || !employee) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`🎯 Processing ${action} for quotation ${quotationId} by ${employee.first_name} ${employee.last_name}`)

    const client = await pool.connect()
    
    try {
      // Begin transaction for data consistency
      await client.query('BEGIN')

      // Get quotation details
      const quotationResult = await client.query(`
        SELECT * FROM quotations WHERE id = $1
      `, [quotationId])

      if (quotationResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: 'Quotation not found' },
          { status: 404 }
        )
      }

      const quotation = quotationResult.rows[0]

      // Update quotation status
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      await client.query(`
        UPDATE quotations 
        SET 
          status = $1,
          updated_at = $2
        WHERE id = $3
      `, [newStatus, new Date(), quotationId])

      // Create approval record
      await client.query(`
        INSERT INTO quotation_approvals (
          quotation_id,
          approval_status,
          comments,
          approver_user_id,
          approval_date,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        quotationId,
        newStatus,
        comments || (action === 'approve' ? 'Approved by Sales Head' : 'Rejected by Sales Head'),
        user.id,
        new Date(),
        new Date(),
        new Date()
      ])

      // Commit transaction
      await client.query('COMMIT')

      // Handle post-approval workflow (outside transaction)
      if (action === 'approve') {
        try {
          // 1. Complete all approval tasks
          await completeApprovalTasks(quotationId)
          console.log('✅ Approval tasks completed')
          
          // 2. Send WhatsApp message using existing function
          console.log('📱 Sending WhatsApp message for approved quotation...')
          await sendApprovalWhatsAppNotification(quotation.quotation_number)
          console.log('✅ WhatsApp approval notification sent successfully')
          
          // 3. Create follow-up task for sales team
          await createPostApprovalFollowUpTask(quotationId, quotation)
          console.log('✅ Post-approval follow-up task created')
          
          // 4. Initialize business lifecycle tracking
          await initializeBusinessLifecycle(quotationId, quotation)
          console.log('✅ Business lifecycle tracking initialized')
          
        } catch (workflowError) {
          console.error('Post-approval workflow error:', workflowError)
          // Don't fail the approval if workflow setup fails
        }
      }
      
      // Handle rejection workflow
      if (action === 'reject') {
        try {
          // 1. Complete all approval tasks
          await completeApprovalTasks(quotationId)
          console.log('✅ Approval tasks completed')
          
          // 2. Send rejection notification to sales resource
          await sendRejectionNotification(quotation.quotation_number, comments || 'No specific reason provided')
          console.log('✅ Rejection notification sent')
          
          // 3. Trigger rejection workflow for revision
          await triggerRejectionWorkflow(quotation.quotation_number, comments || 'No specific reason provided')
          console.log('✅ Rejection workflow triggered')
          
        } catch (workflowError) {
          console.error('Rejection workflow error:', workflowError)
          // Don't fail the rejection if workflow setup fails
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Quotation ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        quotation: {
          id: quotationId,
          status: newStatus,
          action: action,
          comments: comments
        }
      })

    } catch (dbError) {
      await client.query('ROLLBACK')
      throw dbError
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Quotation approval API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 