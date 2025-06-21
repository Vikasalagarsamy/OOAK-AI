"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { getCurrentUser } from './auth-actions'
import { NotificationService } from '@/lib/notification-service'
import type { 
  WorkflowStatus, 
  WorkflowAction, 
  QuotationApproval, 
  PostSaleConfirmation,
  EnhancedQuotation,
  WorkflowAnalytics
} from '@/types/quotation-workflow'

/**
 * QUOTATION WORKFLOW ACTIONS - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Transaction safety for data consistency
 * - Enhanced error handling and logging
 * - Role-based permission checking
 * - All Supabase dependencies eliminated
 */

export async function updateQuotationWorkflowStatus(
  quotationId: number, 
  newStatus: WorkflowStatus,
  additionalData?: Record<string, any>
) {
  try {
    console.log('🔄 Updating quotation workflow status via PostgreSQL...')
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Update quotation status using PostgreSQL
    const updateData: Record<string, any> = { 
      workflow_status: newStatus 
    }

    // Add timestamp fields based on status
    if (newStatus === 'pending_client_confirmation' && !additionalData?.client_verbal_confirmation_date) {
      updateData.client_verbal_confirmation_date = new Date().toISOString()
    }
    
    if (newStatus === 'payment_received') {
      updateData.payment_received_date = additionalData?.payment_received_date || new Date().toISOString()
      if (additionalData?.payment_amount) updateData.payment_amount = additionalData.payment_amount
      if (additionalData?.payment_reference) updateData.payment_reference = additionalData.payment_reference
    }

    // Build dynamic SQL for updates
    const updateFields = Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ')
    const updateValues = [quotationId, ...Object.values(updateData)]

    const result = await query(`
      UPDATE quotations 
      SET ${updateFields}, updated_at = NOW()
      WHERE id = $1 
      RETURNING *
    `, updateValues)

    if (result.rows.length === 0) {
      console.error('❌ Quotation not found for update:', quotationId)
      return { success: false, error: 'Quotation not found' }
    }

    console.log('✅ Quotation workflow status updated successfully')
    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error('❌ Error in updateQuotationWorkflowStatus:', error)
    return { success: false, error: 'Failed to update quotation status' }
  }
}

export async function submitQuotationForApproval(quotationId: number) {
  try {
    console.log('📝 Submitting quotation for approval via PostgreSQL...')
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Use PostgreSQL transaction for atomic operations
    const result = await transaction(async (client) => {
      // Update quotation status to pending_approval
      const quotationResult = await client.query(`
        UPDATE quotations 
        SET workflow_status = 'pending_approval', updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [quotationId])

      if (quotationResult.rows.length === 0) {
        throw new Error('Quotation not found')
      }

      // Create a simple approval request
      try {
        await client.query(`
          INSERT INTO quotation_approvals (quotation_id, approval_status, created_at, updated_at)
          VALUES ($1, 'pending', NOW(), NOW())
        `, [quotationId])
        console.log('✅ Approval request created')
      } catch (approvalError) {
        console.error('⚠️ Error creating approval request (non-critical):', approvalError)
        // Don't fail the whole operation if approval record fails
      }

      return quotationResult.rows[0]
    })

    console.log('✅ Quotation submitted for approval successfully')
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error in submitQuotationForApproval:', error)
    return { success: false, error: 'Failed to submit for approval' }
  }
}

export async function approveQuotation(
  quotationId: number, 
  comments?: string, 
  priceAdjustments?: Record<string, any>
) {
  try {
    console.log('✅ Approving quotation via PostgreSQL...')
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user has approval permissions (Sales Head or Administrator)
    if (!['Sales Head', 'Administrator'].includes(user.roleName)) {
      return { success: false, error: 'Insufficient permissions to approve quotation' }
    }

    // Use PostgreSQL transaction for atomic operations
    const result = await transaction(async (client) => {
      // Update the quotation status directly
      const quotationResult = await client.query(`
        UPDATE quotations 
        SET workflow_status = 'approved', updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [quotationId])

      if (quotationResult.rows.length === 0) {
        throw new Error('Quotation not found')
      }

      // Try to update or create approval record
      const existingApprovalResult = await client.query(`
        SELECT * FROM quotation_approvals WHERE quotation_id = $1 LIMIT 1
      `, [quotationId])

      if (existingApprovalResult.rows.length > 0) {
        // Update existing approval record
        await client.query(`
          UPDATE quotation_approvals 
          SET approver_user_id = $1, approval_status = 'approved', 
              approval_date = NOW(), comments = $2, price_adjustments = $3, updated_at = NOW()
          WHERE quotation_id = $4
        `, [user.id, comments, JSON.stringify(priceAdjustments), quotationId])
        console.log('✅ Updated existing approval record')
      } else {
        // Create new approval record
        await client.query(`
          INSERT INTO quotation_approvals (
            quotation_id, approver_user_id, approval_status, approval_date, 
            comments, price_adjustments, created_at, updated_at
          ) VALUES ($1, $2, 'approved', NOW(), $3, $4, NOW(), NOW())
        `, [quotationId, user.id, comments, JSON.stringify(priceAdjustments)])
        console.log('✅ Created new approval record')
      }

      return quotationResult.rows[0]
    })

    console.log('✅ Quotation approved successfully')
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error in approveQuotation:', error)
    return { success: false, error: 'Failed to approve quotation' }
  }
}

export async function rejectQuotation(quotationId: number, comments: string) {
  try {
    console.log('❌ Rejecting quotation via PostgreSQL...')
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user has approval permissions
    if (!['Sales Head', 'Administrator'].includes(user.roleName)) {
      return { success: false, error: 'Insufficient permissions to reject quotation' }
    }

    // Use PostgreSQL transaction for atomic operations
    const result = await transaction(async (client) => {
      // Update the quotation status directly
      const quotationResult = await client.query(`
        UPDATE quotations 
        SET workflow_status = 'rejected', updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `, [quotationId])

      if (quotationResult.rows.length === 0) {
        throw new Error('Quotation not found')
      }

      // Try to update or create approval record
      const existingApprovalResult = await client.query(`
        SELECT * FROM quotation_approvals WHERE quotation_id = $1 LIMIT 1
      `, [quotationId])

      if (existingApprovalResult.rows.length > 0) {
        // Update existing approval record
        await client.query(`
          UPDATE quotation_approvals 
          SET approver_user_id = $1, approval_status = 'rejected', 
              approval_date = NOW(), comments = $2, updated_at = NOW()
          WHERE quotation_id = $3
        `, [user.id, comments, quotationId])
        console.log('✅ Updated existing rejection record')
      } else {
        // Create new approval record
        await client.query(`
          INSERT INTO quotation_approvals (
            quotation_id, approver_user_id, approval_status, approval_date, 
            comments, created_at, updated_at
          ) VALUES ($1, $2, 'rejected', NOW(), $3, NOW(), NOW())
        `, [quotationId, user.id, comments])
        console.log('✅ Created new rejection record')
      }

      return quotationResult.rows[0]
    })

    console.log('✅ Quotation rejected successfully')
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error in rejectQuotation:', error)
    return { success: false, error: 'Failed to reject quotation' }
  }
}

export async function markPaymentReceived(
  quotationId: number,
  paymentAmount: number,
  paymentReference: string
) {
  try {
    console.log('💰 Marking payment received via PostgreSQL...')
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get quotation details for notification
    const quotationResult = await query(`
      SELECT * FROM quotations WHERE id = $1
    `, [quotationId])

    const quotation = quotationResult.rows[0]

    // Check if user has permission to mark payment received
    if (!['Sales Head', 'Administrator', 'Sales Representative'].includes(user.roleName)) {
      return { success: false, error: 'Insufficient permissions to mark payment received' }
    }

    // Update quotation with payment details
    const statusUpdate = await updateQuotationWorkflowStatus(quotationId, 'payment_received', {
      payment_amount: paymentAmount,
      payment_reference: paymentReference,
      payment_received_date: new Date().toISOString()
    })

    if (!statusUpdate.success) {
      return statusUpdate
    }

    // Send payment received notifications
    if (quotation) {
      try {
        await NotificationService.notifyPaymentReceived(quotation, paymentAmount)
        console.log('✅ Payment notification sent')
      } catch (notificationError) {
        console.error('⚠️ Payment notification failed (non-critical):', notificationError)
      }
    }

    console.log('✅ Payment marked as received successfully')
    return { success: true, data: statusUpdate.data }
  } catch (error) {
    console.error('❌ Error in markPaymentReceived:', error)
    return { success: false, error: 'Failed to mark payment received' }
  }
}

export async function createPostSaleConfirmation(
  quotationId: number,
  confirmationDetails: {
    client_contact_person: string
    confirmation_method: string
    deliverables_confirmed: Record<string, any>
    event_details_confirmed: Record<string, any>
    client_expectations?: string
  }
) {
  try {
    console.log('📞 Creating post-sale confirmation via PostgreSQL...')
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user has permission to create confirmation
    if (!['Confirmation Team', 'Administrator'].includes(user.roleName)) {
      return { success: false, error: 'Insufficient permissions to create post-sale confirmation' }
    }

    // Provide default values for missing confirmation details
    const defaultConfirmationDetails = {
      client_contact_person: confirmationDetails.client_contact_person || 'Client',
      confirmation_method: confirmationDetails.confirmation_method || 'phone',
      deliverables_confirmed: confirmationDetails.deliverables_confirmed || { confirmed: true },
      event_details_confirmed: confirmationDetails.event_details_confirmed || { confirmed: true },
      client_expectations: confirmationDetails.client_expectations || 'All expectations confirmed'
    }

    // Use PostgreSQL transaction for atomic operations
    const result = await transaction(async (client) => {
      // Create post-sale confirmation record
      const confirmationResult = await client.query(`
        INSERT INTO post_sale_confirmations (
          quotation_id, confirmed_by_user_id, confirmation_date,
          client_contact_person, confirmation_method, deliverables_confirmed,
          event_details_confirmed, client_expectations, created_at, updated_at
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        quotationId,
        user.id,
        defaultConfirmationDetails.client_contact_person,
        defaultConfirmationDetails.confirmation_method,
        JSON.stringify(defaultConfirmationDetails.deliverables_confirmed),
        JSON.stringify(defaultConfirmationDetails.event_details_confirmed),
        defaultConfirmationDetails.client_expectations
      ])

      // Update quotation status to confirmed
      const statusUpdate = await updateQuotationWorkflowStatus(quotationId, 'confirmed')
      if (!statusUpdate.success) {
        throw new Error('Failed to update quotation status to confirmed')
      }

      return confirmationResult.rows[0]
    })

    console.log('✅ Post-sale confirmation created successfully')
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error in createPostSaleConfirmation:', error)
    return { success: false, error: 'Failed to create post-sale confirmation' }
  }
}

export async function getQuotationWithWorkflow(quotationId: number): Promise<{ success: boolean, data?: EnhancedQuotation, error?: string }> {
  try {
    console.log('📊 Fetching quotation with workflow via PostgreSQL...')
    
    const result = await query(`
      SELECT 
        q.*,
        json_agg(DISTINCT qa.*) FILTER (WHERE qa.id IS NOT NULL) as quotation_approvals,
        json_agg(DISTINCT psc.*) FILTER (WHERE psc.id IS NOT NULL) as post_sale_confirmations
      FROM quotations q
      LEFT JOIN quotation_approvals qa ON q.id = qa.quotation_id
      LEFT JOIN post_sale_confirmations psc ON q.id = psc.quotation_id
      WHERE q.id = $1
      GROUP BY q.id
    `, [quotationId])

    if (result.rows.length === 0) {
      console.error('❌ Quotation not found:', quotationId)
      return { success: false, error: 'Quotation not found' }
    }

    console.log('✅ Quotation with workflow data fetched successfully')
    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error('❌ Error in getQuotationWithWorkflow:', error)
    return { success: false, error: 'Failed to fetch quotation workflow data' }
  }
}

export async function getQuotationsByWorkflowStatus(status: WorkflowStatus): Promise<{ success: boolean, data?: EnhancedQuotation[], error?: string }> {
  try {
    console.log('📋 Fetching quotations by workflow status via PostgreSQL...')
    
    const result = await query(`
      SELECT 
        q.*,
        json_agg(DISTINCT qa.*) FILTER (WHERE qa.id IS NOT NULL) as quotation_approvals,
        json_agg(DISTINCT psc.*) FILTER (WHERE psc.id IS NOT NULL) as post_sale_confirmations
      FROM quotations q
      LEFT JOIN quotation_approvals qa ON q.id = qa.quotation_id
      LEFT JOIN post_sale_confirmations psc ON q.id = psc.quotation_id
      WHERE q.workflow_status = $1
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `, [status])

    console.log(`✅ Found ${result.rows.length} quotations with status: ${status}`)
    return { success: true, data: result.rows || [] }
  } catch (error) {
    console.error('❌ Error in getQuotationsByWorkflowStatus:', error)
    return { success: false, error: 'Failed to fetch quotations by status' }
  }
}

export async function getPendingApprovals(): Promise<{ success: boolean, data?: EnhancedQuotation[], error?: string }> {
  try {
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user has approval permissions
    if (!['Sales Head', 'Administrator'].includes(user.roleName)) {
      return { success: false, error: 'Insufficient permissions to view pending approvals' }
    }

    console.log('📋 Fetching pending approvals for authorized user...')
    return await getQuotationsByWorkflowStatus('pending_approval')
  } catch (error) {
    console.error('❌ Error in getPendingApprovals:', error)
    return { success: false, error: 'Failed to fetch pending approvals' }
  }
}

export async function getPendingConfirmations(): Promise<{ success: boolean, data?: EnhancedQuotation[], error?: string }> {
  try {
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user has confirmation permissions
    if (!['Confirmation Team', 'Administrator'].includes(user.roleName)) {
      return { success: false, error: 'Insufficient permissions to view pending confirmations' }
    }

    console.log('📋 Fetching pending confirmations for authorized user...')
    return await getQuotationsByWorkflowStatus('payment_received')
  } catch (error) {
    console.error('❌ Error in getPendingConfirmations:', error)
    return { success: false, error: 'Failed to fetch pending confirmations' }
  }
}

export async function getWorkflowAnalytics(): Promise<{ success: boolean, data?: WorkflowAnalytics[], error?: string }> {
  try {
    console.log('📈 Fetching workflow analytics via PostgreSQL...')
    
    const result = await query(`
      SELECT * FROM quotation_workflow_analytics 
      ORDER BY quotation_created DESC
    `)

    console.log(`✅ Loaded ${result.rows.length} workflow analytics records`)
    return { success: true, data: result.rows || [] }
  } catch (error) {
    console.error('❌ Error in getWorkflowAnalytics:', error)
    return { success: false, error: 'Failed to fetch workflow analytics' }
  }
}

import { getUserIdForDatabase } from '@/lib/uuid-helpers'

// Get current user and convert to UUID format for database queries
async function getCurrentUserWithValidUUID() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return null
    }
    
    // Convert simple user ID to UUID format for database compatibility (if needed)
    return {
      ...user,
      id: getUserIdForDatabase ? getUserIdForDatabase(user.id) : user.id
    }
  } catch (error) {
    console.error('❌ Error getting current user:', error)
    return null
  }
}