import { pool } from '@/lib/postgresql-client'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

/**
 * 🔐 QUOTATION EDIT APPROVAL SYSTEM (PostgreSQL)
 * ==============================================
 * 
 * Handles approval workflow for any quotation modifications.
 * Ensures strict control over quotation changes to prevent unauthorized edits.
 */

// Submit quotation edit for approval
export async function POST(request: NextRequest) {
  try {
    const { 
      quotationId, 
      originalData, 
      modifiedData, 
      changesSummary, 
      editReason 
    } = await request.json()

    console.log('🔐 Processing quotation edit approval request:', { quotationId, editReason })

    if (!quotationId || !originalData || !modifiedData) {
      return NextResponse.json({ 
        error: 'Quotation ID, original data, and modified data are required' 
      }, { status: 400 })
    }

    // Get current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('🔐 Current user for approval request:', currentUser)

    // Get employee ID for the current user - ensure it's an integer
    let employeeId = currentUser.id
    
    // Convert to integer if it's a string
    if (typeof employeeId === 'string') {
      employeeId = parseInt(employeeId)
    }
    
    const client = await pool.connect()
    
    // If no employeeId or conversion failed, try to find it from user_accounts table
    if (!employeeId || isNaN(employeeId)) {
      console.log('🔍 Looking up employee ID from user_accounts table for user:', currentUser.id)
      const userAccountQuery = `
        SELECT employee_id FROM user_accounts 
        WHERE id = $1
      `
      
      const userResult = await client.query(userAccountQuery, [currentUser.id])
      
      if (!userResult.rows.length || !userResult.rows[0].employee_id) {
        client.release()
        console.error('❌ No employee ID found for user:', currentUser.id)
        return NextResponse.json({ 
          error: 'Employee ID not found. Please contact administrator.' 
        }, { status: 400 })
      }
      
      employeeId = parseInt(userResult.rows[0].employee_id.toString())
    }
    
    console.log('🔐 Using employee ID:', employeeId, 'type:', typeof employeeId)

    // Start transaction for approval workflow
    await client.query('BEGIN')

    try {
      // Get quotation details
      const quotationQuery = `
        SELECT * FROM quotations WHERE id = $1
      `
      const quotationResult = await client.query(quotationQuery, [quotationId])

      if (!quotationResult.rows.length) {
        await client.query('ROLLBACK')
        client.release()
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
      }

      const quotation = quotationResult.rows[0]

      // Calculate change impact
      const originalAmount = calculateQuotationAmount(originalData)
      const modifiedAmount = calculateQuotationAmount(modifiedData)
      const amountDifference = modifiedAmount - originalAmount
      const percentageChange = originalAmount > 0 ? ((amountDifference / originalAmount) * 100) : 0

      console.log(`💰 Edit impact: ₹${originalAmount.toLocaleString()} → ₹${modifiedAmount.toLocaleString()} (${percentageChange.toFixed(1)}% change)`)

      // Create edit approval request
      const insertApprovalQuery = `
        INSERT INTO quotation_edit_approvals (
          quotation_id,
          requested_by,
          original_data,
          modified_data,
          changes_summary,
          edit_reason,
          original_amount,
          modified_amount,
          amount_difference,
          percentage_change,
          approval_status,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `
      
      const approvalValues = [
        quotationId,
        employeeId,
        JSON.stringify(originalData),
        JSON.stringify(modifiedData),
        changesSummary,
        editReason,
        originalAmount,
        modifiedAmount,
        amountDifference,
        percentageChange,
        'pending',
        new Date().toISOString(),
        new Date().toISOString()
      ]

      const approvalResult = await client.query(insertApprovalQuery, approvalValues)
      const editRequest = approvalResult.rows[0]

      // Update quotation status to indicate edit pending approval
      const updateQuotationQuery = `
        UPDATE quotations 
        SET status = $1, workflow_status = $2, updated_at = $3
        WHERE id = $4
      `
      
      await client.query(updateQuotationQuery, [
        'edit_pending_approval',
        'edit_pending_approval',
        new Date().toISOString(),
        quotationId
      ])

      // Create approval task for Sales Head
      await createEditApprovalTask(client, quotation, editRequest, currentUser)

      // Send notification to Sales Head
      await sendEditApprovalNotification(client, quotation, editRequest, currentUser)

      await client.query('COMMIT')
      client.release()

      console.log('✅ Quotation edit approval request created successfully')

      return NextResponse.json({
        success: true,
        message: 'Quotation edit submitted for approval',
        approval_request_id: editRequest.id,
        changes_summary: {
          original_amount: originalAmount,
          modified_amount: modifiedAmount,
          amount_difference: amountDifference,
          percentage_change: percentageChange
        },
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })

    } catch (transactionError) {
      await client.query('ROLLBACK')
      client.release()
      throw transactionError
    }

  } catch (error: any) {
    console.error('❌ Error in quotation edit approval:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      source: "PostgreSQL"
    }, { status: 500 })
  }
}

// Approve or reject quotation edit
export async function PUT(request: NextRequest) {
  try {
    const { approvalRequestId, action, comments } = await request.json()

    console.log('🎯 Processing edit approval decision:', { approvalRequestId, action })

    if (!approvalRequestId || !action) {
      return NextResponse.json({ 
        error: 'Approval request ID and action are required' 
      }, { status: 400 })
    }

    // Get current user (must be Sales Head or authorized approver)
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get employee ID for the current user - ensure it's an integer
    let employeeId = currentUser.id
    
    // Convert to integer if it's a string
    if (typeof employeeId === 'string') {
      employeeId = parseInt(employeeId)
    }
    
    const client = await pool.connect()
    
    // If no employeeId or conversion failed, try to find it from user_accounts table
    if (!employeeId || isNaN(employeeId)) {
      const userAccountQuery = `
        SELECT employee_id FROM user_accounts 
        WHERE id = $1
      `
      
      const userResult = await client.query(userAccountQuery, [currentUser.id])
      
      if (!userResult.rows.length || !userResult.rows[0].employee_id) {
        client.release()
        return NextResponse.json({ 
          error: 'Employee ID not found. Please contact administrator.' 
        }, { status: 400 })
      }
      
      employeeId = parseInt(userResult.rows[0].employee_id.toString())
    }

    // Check approval authority
    const hasAuthority = await checkApprovalAuthority(client, employeeId)
    if (!hasAuthority) {
      client.release()
      return NextResponse.json({ error: 'Insufficient privileges for approval' }, { status: 403 })
    }

    // Start transaction for approval processing
    await client.query('BEGIN')

    try {
      // Get approval request
      const approvalQuery = `
        SELECT * FROM quotation_edit_approvals 
        WHERE id = $1 AND approval_status = 'pending'
      `
      const approvalResult = await client.query(approvalQuery, [approvalRequestId])

      if (!approvalResult.rows.length) {
        await client.query('ROLLBACK')
        client.release()
        return NextResponse.json({ error: 'Approval request not found or already processed' }, { status: 404 })
      }

      const approvalRequest = approvalResult.rows[0]
      const isApproved = action === 'approve'

      // Update approval request
      const updateApprovalQuery = `
        UPDATE quotation_edit_approvals
        SET approval_status = $1,
            approved_by = $2,
            approval_comments = $3,
            approved_at = $4,
            updated_at = $5
        WHERE id = $6
        RETURNING *
      `
      
      const updatedApproval = await client.query(updateApprovalQuery, [
        isApproved ? 'approved' : 'rejected',
        employeeId,
        comments,
        new Date().toISOString(),
        new Date().toISOString(),
        approvalRequestId
      ])

      if (isApproved) {
        // Apply approved changes
        await applyApprovedChanges(client, approvalRequest.quotation_id, JSON.parse(approvalRequest.modified_data))
        
        // Update quotation status back to active
        const updateQuotationQuery = `
          UPDATE quotations 
          SET status = $1, workflow_status = $2, updated_at = $3
          WHERE id = $4
        `
        
        await client.query(updateQuotationQuery, [
          'active',
          'approved',
          new Date().toISOString(),
          approvalRequest.quotation_id
        ])
      } else {
        // Rejection - revert quotation status
        const updateQuotationQuery = `
          UPDATE quotations 
          SET status = $1, workflow_status = $2, updated_at = $3
          WHERE id = $4
        `
        
        await client.query(updateQuotationQuery, [
          'active',
          'edit_rejected',
          new Date().toISOString(),
          approvalRequest.quotation_id
        ])
      }

      // Complete approval task
      await completeEditApprovalTask(client, approvalRequest.quotation_id, isApproved)

      // Send decision notification
      await sendEditDecisionNotification(client, updatedApproval.rows[0], isApproved, comments, currentUser)

      await client.query('COMMIT')
      client.release()

      console.log(`✅ Quotation edit ${isApproved ? 'approved' : 'rejected'} successfully`)

      return NextResponse.json({
        success: true,
        message: `Quotation edit ${isApproved ? 'approved' : 'rejected'} successfully`,
        action: action,
        approval_request_id: approvalRequestId,
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })

    } catch (transactionError) {
      await client.query('ROLLBACK')
      client.release()
      throw transactionError
    }

  } catch (error: any) {
    console.error('❌ Error in approval decision:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      source: "PostgreSQL"
    }, { status: 500 })
  }
}

// Get pending approval requests
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching quotation edit approval requests from PostgreSQL...')
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const quotationId = searchParams.get('quotationId')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const client = await pool.connect()
    
    let query = `
      SELECT 
        qea.*,
        q.quotation_number,
        q.client_name,
        q.total_amount,
        COALESCE(e.name, 
          CASE 
            WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
            THEN CONCAT(e.first_name, ' ', e.last_name)
            ELSE CONCAT('Employee #', e.id)
          END
        ) as requested_by_name,
        COALESCE(a.name, 
          CASE 
            WHEN a.first_name IS NOT NULL AND a.last_name IS NOT NULL 
            THEN CONCAT(a.first_name, ' ', a.last_name)
            ELSE CONCAT('Employee #', a.id)
          END
        ) as approved_by_name
      FROM quotation_edit_approvals qea
      JOIN quotations q ON qea.quotation_id = q.id
      LEFT JOIN employees e ON qea.requested_by = e.id
      LEFT JOIN employees a ON qea.approved_by = a.id
    `
    
    let params: any[] = []
    let conditions: string[] = []
    let paramCount = 0
    
    if (status) {
      paramCount++
      conditions.push(`qea.approval_status = $${paramCount}`)
      params.push(status)
    }
    
    if (quotationId) {
      paramCount++
      conditions.push(`qea.quotation_id = $${paramCount}`)
      params.push(quotationId)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY qea.created_at DESC`
    
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }
    
    const result = await client.query(query, params)
    client.release()

    console.log(`✅ Found ${result.rows.length} approval requests from PostgreSQL`)

    return NextResponse.json({
      success: true,
      approval_requests: result.rows,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        total: result.rows.length,
        status_filter: status,
        quotation_filter: quotationId
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching approval requests from PostgreSQL:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch approval requests', 
        details: error.message,
        source: "PostgreSQL"
      }, 
      { status: 500 }
    )
  }
}

// Helper functions
function calculateQuotationAmount(quotationData: any): number {
  try {
    if (quotationData.total_amount && typeof quotationData.total_amount === 'number') {
      return quotationData.total_amount
    }
    
    if (quotationData.services && Array.isArray(quotationData.services)) {
      return quotationData.services.reduce((total: number, service: any) => {
        return total + (service.amount || 0)
      }, 0)
    }
    
    return 0
  } catch (error) {
    console.error('Error calculating quotation amount:', error)
    return 0
  }
}

async function checkApprovalAuthority(client: any, employeeId: number): Promise<boolean> {
  try {
    const authorityQuery = `
      SELECT e.id FROM employees e
      JOIN roles r ON e.role_id = r.id
      WHERE e.id = $1 AND r.title IN ('Sales Head', 'Manager', 'Administrator')
    `
    
    const result = await client.query(authorityQuery, [employeeId])
    return result.rows.length > 0
  } catch (error) {
    console.error('Error checking approval authority:', error)
    return false
  }
}

async function createEditApprovalTask(client: any, quotation: any, editRequest: any, requester: any) {
  try {
    const taskQuery = `
      INSERT INTO ai_tasks (
        title,
        description,
        task_type,
        priority,
        status,
        assigned_to,
        metadata,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `
    
    const taskValues = [
      `Quotation Edit Approval Required - ${quotation.quotation_number}`,
      `Review and approve edit request for quotation ${quotation.quotation_number} (${quotation.client_name})`,
      'approval',
      'high',
      'pending',
      1, // Assume Sales Head ID is 1, should be dynamic
      JSON.stringify({
        quotation_id: quotation.id,
        approval_request_id: editRequest.id,
        requester_id: requester.id
      }),
      new Date().toISOString(),
      new Date().toISOString()
    ]
    
    await client.query(taskQuery, taskValues)
    console.log('✅ Approval task created')
  } catch (error) {
    console.error('Error creating approval task:', error)
  }
}

async function sendEditApprovalNotification(client: any, quotation: any, editRequest: any, requester: any) {
  try {
    const notificationQuery = `
      INSERT INTO notifications (
        title,
        message,
        type,
        target_user_id,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `
    
    const notificationValues = [
      'Quotation Edit Approval Required',
      `${requester.username || 'User'} has requested approval to edit quotation ${quotation.quotation_number}`,
      'approval_request',
      1, // Sales Head ID
      JSON.stringify({
        quotation_id: quotation.id,
        approval_request_id: editRequest.id
      }),
      new Date().toISOString()
    ]
    
    await client.query(notificationQuery, notificationValues)
    console.log('✅ Approval notification sent')
  } catch (error) {
    console.error('Error sending approval notification:', error)
  }
}

async function applyApprovedChanges(client: any, quotationId: number, modifiedData: any) {
  try {
    const updateQuery = `
      UPDATE quotations 
      SET 
        client_name = $1,
        total_amount = $2,
        updated_at = $3
      WHERE id = $4
    `
    
    const updateValues = [
      modifiedData.client_name || null,
      modifiedData.total_amount || 0,
      new Date().toISOString(),
      quotationId
    ]
    
    await client.query(updateQuery, updateValues)
    console.log('✅ Approved changes applied to quotation')
  } catch (error) {
    console.error('Error applying approved changes:', error)
  }
}

async function completeEditApprovalTask(client: any, quotationId: number, isApproved: boolean) {
  try {
    const updateTaskQuery = `
      UPDATE ai_tasks 
      SET status = $1, updated_at = $2
      WHERE task_type = 'approval' 
        AND metadata->>'quotation_id' = $3
        AND status = 'pending'
    `
    
    await client.query(updateTaskQuery, [
      isApproved ? 'completed' : 'cancelled',
      new Date().toISOString(),
      quotationId.toString()
    ])
    
    console.log('✅ Approval task completed')
  } catch (error) {
    console.error('Error completing approval task:', error)
  }
}

async function sendEditDecisionNotification(client: any, approvalRequest: any, isApproved: boolean, comments: string, approver: any) {
  try {
    const notificationQuery = `
      INSERT INTO notifications (
        title,
        message,
        type,
        target_user_id,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `
    
    const notificationValues = [
      `Quotation Edit ${isApproved ? 'Approved' : 'Rejected'}`,
      `Your quotation edit request has been ${isApproved ? 'approved' : 'rejected'}. ${comments ? `Comments: ${comments}` : ''}`,
      isApproved ? 'approval_granted' : 'approval_denied',
      approvalRequest.requested_by,
      JSON.stringify({
        quotation_id: approvalRequest.quotation_id,
        approval_request_id: approvalRequest.id
      }),
      new Date().toISOString()
    ]
    
    await client.query(notificationQuery, notificationValues)
    console.log('✅ Decision notification sent')
  } catch (error) {
    console.error('Error sending decision notification:', error)
  }
} 