// Quotation Workflow Types
export type WorkflowStatus = 
  | 'draft'
  | 'pending_client_confirmation'
  | 'pending_approval'
  | 'approved'
  | 'payment_received'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type ConfirmationMethod = 'phone' | 'video_call' | 'in_person' | 'email'

export interface QuotationApproval {
  id: number
  quotation_id: number
  approver_user_id: string | null // UUID as string
  approval_status: ApprovalStatus
  approval_date?: string
  comments?: string
  price_adjustments?: Record<string, any>
  created_at: string
  updated_at: string
  // Relations
  approver?: {
    id: string
    username: string
    role_name: string
  }
}

export interface PostSaleConfirmation {
  id: number
  quotation_id: number
  confirmed_by_user_id: string // UUID as string
  client_contact_person?: string
  confirmation_date?: string
  deliverables_confirmed?: Record<string, any>
  event_details_confirmed?: Record<string, any>
  client_expectations?: string
  confirmation_method: ConfirmationMethod
  confirmation_document_sent: boolean
  created_at: string
  // Relations
  confirmed_by?: {
    id: string
    username: string
    role_name: string
  }
}

export interface EnhancedQuotation {
  id: number
  client_name: string
  bride_name: string
  groom_name: string
  email: string
  mobile: string
  total_amount: number
  workflow_status: WorkflowStatus
  client_verbal_confirmation_date?: string
  payment_received_date?: string
  payment_amount?: number
  payment_reference?: string
  confirmation_required: boolean
  created_at: string
  // Relations
  approval?: QuotationApproval
  post_sale_confirmation?: PostSaleConfirmation
  // Additional quotation fields
  quotation_number?: string
  slug?: string
  default_package?: string
  status?: string
  events_count?: number
}

export interface QuotationItem {
  id: number
  name: string
  quantity: number
  unit_price: number
  total_price: number
  description?: string
}

export interface WorkflowAction {
  action: 'submit_for_approval' | 'approve' | 'reject' | 'mark_payment_received' | 'confirm_post_sale'
  comments?: string
  price_adjustments?: Record<string, any>
  payment_details?: {
    amount: number
    reference: string
    date: string
  }
  confirmation_details?: {
    client_contact_person: string
    confirmation_method: ConfirmationMethod
    deliverables_confirmed: Record<string, any>
    event_details_confirmed: Record<string, any>
    client_expectations?: string
  }
}

export interface WorkflowPermissions {
  can_submit_for_approval: boolean
  can_approve: boolean
  can_reject: boolean
  can_mark_payment_received: boolean
  can_confirm_post_sale: boolean
  can_cancel: boolean
}

export interface WorkflowAnalytics {
  quotation_id: number
  client_name: string
  bride_name: string
  groom_name: string
  email: string
  mobile: string
  total_amount: number
  workflow_status: WorkflowStatus
  quotation_created: string
  client_verbal_confirmation_date?: string
  payment_received_date?: string
  payment_amount?: number
  approval_date?: string
  confirmation_date?: string
  days_to_client_confirmation?: number
  days_to_approval?: number
  days_to_payment?: number
  days_to_confirmation?: number
}

// Status display helpers
export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  draft: 'Draft',
  pending_client_confirmation: 'Pending Client Confirmation',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  payment_received: 'Payment Received',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled'
}

export const WORKFLOW_STATUS_COLORS: Record<WorkflowStatus, string> = {
  draft: 'gray',
  pending_client_confirmation: 'blue',
  pending_approval: 'yellow',
  approved: 'green',
  payment_received: 'purple',
  confirmed: 'emerald',
  rejected: 'red',
  cancelled: 'slate'
}

// Workflow state machine helpers
export const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ['pending_client_confirmation', 'cancelled'],
  pending_client_confirmation: ['pending_approval', 'rejected', 'cancelled'],
  pending_approval: ['approved', 'rejected'],
  approved: ['payment_received', 'cancelled'],
  payment_received: ['confirmed', 'cancelled'],
  confirmed: [],
  rejected: [],
  cancelled: []
}

export const WORKFLOW_ACTIONS_BY_STATUS: Record<WorkflowStatus, string[]> = {
  draft: ['submit_for_confirmation'],
  pending_client_confirmation: ['submit_for_approval', 'reject', 'cancel'],
  pending_approval: ['approve', 'reject'],
  approved: ['mark_payment_received', 'cancel'],
  payment_received: ['confirm_post_sale', 'cancel'],
  confirmed: [],
  rejected: [],
  cancelled: []
}

// Role-based permissions
export const getWorkflowPermissions = (userRole: string, currentStatus: WorkflowStatus): WorkflowPermissions => {
  const isSalesHead = userRole === 'Sales Head' || userRole === 'Administrator'
  const isSalesResource = userRole === 'Sales Resource' || userRole === 'Administrator'
  const isConfirmationTeam = userRole === 'Confirmation Team' || userRole === 'Administrator'
  const isFinance = userRole === 'Finance' || userRole === 'Administrator'

  return {
    can_submit_for_approval: isSalesResource && (currentStatus === 'draft' || currentStatus === 'pending_client_confirmation'),
    can_approve: isSalesHead && (currentStatus === 'pending_approval'),
    can_reject: isSalesHead && (currentStatus === 'pending_approval'),
    can_mark_payment_received: (isSalesHead || isFinance) && (currentStatus === 'approved'),
    can_confirm_post_sale: isConfirmationTeam && (currentStatus === 'payment_received'),
    can_cancel: (isSalesHead || isSalesResource) && ['pending_client_confirmation', 'pending_approval', 'approved', 'payment_received'].includes(currentStatus)
  }
} 