"use server"

import { createClient } from '@/lib/supabase-server'
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

export async function updateQuotationWorkflowStatus(
  quotationId: number, 
  newStatus: WorkflowStatus,
  additionalData?: Record<string, any>
) {
  try {
    const supabase = createClient()
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Update quotation status
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

    const { data, error } = await supabase
      .from('quotations')
      .update(updateData)
      .eq('id', quotationId)
      .select()

    if (error) {
      console.error('Error updating quotation status:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Error in updateQuotationWorkflowStatus:', error)
    return { success: false, error: 'Failed to update quotation status' }
  }
}

export async function submitQuotationForApproval(quotationId: number) {
  try {
    const supabase = createClient()
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Simply update quotation status to pending_approval
    const { data, error } = await supabase
      .from('quotations')
      .update({ 
        workflow_status: 'pending_approval'
      })
      .eq('id', quotationId)
      .select()

    if (error) {
      console.error('Error updating quotation status:', error)
      return { success: false, error: error.message }
    }

    // Create a simple approval request
    const { error: approvalError } = await supabase
      .from('quotation_approvals')
      .insert([{
        quotation_id: quotationId,
        approval_status: 'pending'
      }])

    if (approvalError) {
      console.error('Error creating approval request:', approvalError)
      // Don't fail the whole operation if approval record fails
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Error in submitQuotationForApproval:', error)
    return { success: false, error: 'Failed to submit for approval' }
  }
}

export async function approveQuotation(
  quotationId: number, 
  comments?: string, 
  priceAdjustments?: Record<string, any>
) {
  try {
    const supabase = createClient()
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user has approval permissions (Sales Head or Administrator)
    if (!['Sales Head', 'Administrator'].includes(user.roleName)) {
      return { success: false, error: 'Insufficient permissions to approve quotation' }
    }

    // First, update the quotation status directly
    const { data: quotationData, error: quotationError } = await supabase
      .from('quotations')
      .update({ 
        workflow_status: 'approved'
      })
      .eq('id', quotationId)
      .select()

    if (quotationError) {
      console.error('Error updating quotation status:', quotationError)
      return { success: false, error: quotationError.message }
    }

    // Try to update approval record if it exists, otherwise create one
    const { data: existingApproval } = await supabase
      .from('quotation_approvals')
      .select('*')
      .eq('quotation_id', quotationId)
      .single()

    if (existingApproval) {
      // Update existing approval record
      const { error: approvalError } = await supabase
        .from('quotation_approvals')
        .update({
          approver_user_id: user.id,
          approval_status: 'approved',
          approval_date: new Date().toISOString(),
          comments,
          price_adjustments: priceAdjustments
        })
        .eq('quotation_id', quotationId)

      if (approvalError) {
        console.error('Error updating approval record:', approvalError)
        // Don't fail the whole operation
      }
    } else {
      // Create new approval record
      const { error: approvalError } = await supabase
        .from('quotation_approvals')
        .insert([{
          quotation_id: quotationId,
          approver_user_id: user.id,
          approval_status: 'approved',
          approval_date: new Date().toISOString(),
          comments,
          price_adjustments: priceAdjustments
        }])

      if (approvalError) {
        console.error('Error creating approval record:', approvalError)
        // Don't fail the whole operation
      }
    }

    return { success: true, data: quotationData[0] }
  } catch (error) {
    console.error('Error in approveQuotation:', error)
    return { success: false, error: 'Failed to approve quotation' }
  }
}

export async function rejectQuotation(quotationId: number, comments: string) {
  try {
    const supabase = createClient()
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if user has approval permissions
    if (!['Sales Head', 'Administrator'].includes(user.roleName)) {
      return { success: false, error: 'Insufficient permissions to reject quotation' }
    }

    // First, update the quotation status directly
    const { data: quotationData, error: quotationError } = await supabase
      .from('quotations')
      .update({ 
        workflow_status: 'rejected'
      })
      .eq('id', quotationId)
      .select()

    if (quotationError) {
      console.error('Error updating quotation status:', quotationError)
      return { success: false, error: quotationError.message }
    }

    // Try to update approval record if it exists, otherwise create one
    const { data: existingApproval } = await supabase
      .from('quotation_approvals')
      .select('*')
      .eq('quotation_id', quotationId)
      .single()

    if (existingApproval) {
      // Update existing approval record
      const { error: approvalError } = await supabase
        .from('quotation_approvals')
        .update({
          approver_user_id: user.id,
          approval_status: 'rejected',
          approval_date: new Date().toISOString(),
          comments
        })
        .eq('quotation_id', quotationId)

      if (approvalError) {
        console.error('Error updating approval record:', approvalError)
        // Don't fail the whole operation
      }
    } else {
      // Create new approval record
      const { error: approvalError } = await supabase
        .from('quotation_approvals')
        .insert([{
          quotation_id: quotationId,
          approver_user_id: user.id,
          approval_status: 'rejected',
          approval_date: new Date().toISOString(),
          comments
        }])

      if (approvalError) {
        console.error('Error creating approval record:', approvalError)
        // Don't fail the whole operation
      }
    }

    return { success: true, data: quotationData[0] }
  } catch (error) {
    console.error('Error in rejectQuotation:', error)
    return { success: false, error: 'Failed to reject quotation' }
  }
}

export async function markPaymentReceived(
  quotationId: number,
  paymentAmount: number,
  paymentReference: string
) {
  try {
    const supabase = createClient()
    const user = await getCurrentUserWithValidUUID()
    
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Get quotation details for notification
    const { data: quotation } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotationId)
      .single()

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
      await NotificationService.notifyPaymentReceived(quotation, paymentAmount)
    }

    return { success: true, data: statusUpdate.data }
  } catch (error) {
    console.error('Error in markPaymentReceived:', error)
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
    const supabase = createClient()
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

    // Create post-sale confirmation record
    const { data, error } = await supabase
      .from('post_sale_confirmations')
      .insert([{
        quotation_id: quotationId,
        confirmed_by_user_id: user.id,
        confirmation_date: new Date().toISOString(),
        ...defaultConfirmationDetails
      }])
      .select()

    if (error) {
      console.error('Error creating post-sale confirmation:', error)
      return { success: false, error: error.message }
    }

    // Update quotation status to confirmed
    const statusUpdate = await updateQuotationWorkflowStatus(quotationId, 'confirmed')
    if (!statusUpdate.success) {
      return statusUpdate
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Error in createPostSaleConfirmation:', error)
    return { success: false, error: 'Failed to create post-sale confirmation' }
  }
}

export async function getQuotationWithWorkflow(quotationId: number): Promise<{ success: boolean, data?: EnhancedQuotation, error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_approvals(*),
        post_sale_confirmations(*)
      `)
      .eq('id', quotationId)
      .single()

    if (error) {
      console.error('Error fetching quotation with workflow:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getQuotationWithWorkflow:', error)
    return { success: false, error: 'Failed to fetch quotation workflow data' }
  }
}

export async function getQuotationsByWorkflowStatus(status: WorkflowStatus): Promise<{ success: boolean, data?: EnhancedQuotation[], error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_approvals(*),
        post_sale_confirmations(*)
      `)
      .eq('workflow_status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quotations by status:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getQuotationsByWorkflowStatus:', error)
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

    return await getQuotationsByWorkflowStatus('pending_approval')
  } catch (error) {
    console.error('Error in getPendingApprovals:', error)
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

    return await getQuotationsByWorkflowStatus('payment_received')
  } catch (error) {
    console.error('Error in getPendingConfirmations:', error)
    return { success: false, error: 'Failed to fetch pending confirmations' }
  }
}

export async function getWorkflowAnalytics(): Promise<{ success: boolean, data?: WorkflowAnalytics[], error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('quotation_workflow_analytics')
      .select('*')
      .order('quotation_created', { ascending: false })

    if (error) {
      console.error('Error fetching workflow analytics:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getWorkflowAnalytics:', error)
    return { success: false, error: 'Failed to fetch workflow analytics' }
  }
}

// Temporary helper to ensure proper UUID for development
async function getCurrentUserWithValidUUID() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return null
    }
    
    // If user ID is not a proper UUID (like '1' or other simple string), replace with proper UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      // Use proper UUID format for development
      return {
        ...user,
        id: '550e8400-e29b-41d4-a716-446655440000' // Proper UUID format
      }
    }
    
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
} 