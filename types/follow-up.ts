import type { VALID_FOLLOWUP_TYPES } from "@/lib/follow-up-constants"

export type FollowUpStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "missed" | "rescheduled"
export type FollowupType = (typeof VALID_FOLLOWUP_TYPES)[number]
export type Priority = "low" | "medium" | "high" | "urgent"

// Lead status types
export type LeadStatus = 
  | "NEW"
  | "ASSIGNED" 
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
  | "REJECTED"
  | "UNASSIGNED"

export interface FollowUp {
  id: number
  lead_id: number
  contact_method: string // Standardized field name
  scheduled_at: string
  status: FollowUpStatus
  priority: Priority
  notes?: string | null
  interaction_summary?: string | null
  outcome?: string | null // Set when completed
  duration_minutes?: number | null // Set when completed
  follow_up_required: boolean
  next_follow_up_date?: string | null
  created_by?: string | null // Consistent ID format
  created_at: string
  updated_at?: string | null
  completed_at?: string | null
  completed_by?: string | null
  updated_by?: string | null
  // Legacy field for backward compatibility
  followup_type?: string
}

export interface Lead {
  id: number
  lead_number: string
  client_name: string
  status: LeadStatus
  company_id: number
  branch_id: number | null
  assigned_to: number | null
}

export interface FollowUpFormData {
  lead_id: number
  scheduled_at: string
  contact_method?: string // Optional for backward compatibility
  followup_type?: string // Add this field for compatibility
  notes?: string
  priority: string
  interaction_summary?: string
}

export interface FollowUpWithLead extends FollowUp {
  lead: {
    lead_number: string
    client_name: string
    status: LeadStatus
  }
}

// Enhanced completion data with lead status
export interface FollowUpCompletionData {
  completed_at?: string
  outcome?: string
  duration_minutes?: number
  follow_up_required?: boolean
  next_follow_up_date?: string
  lead_status?: LeadStatus // New field for updating lead status
}

// Status transition validation
export const VALID_STATUS_TRANSITIONS: Record<FollowUpStatus, FollowUpStatus[]> = {
  scheduled: ['in_progress', 'completed', 'cancelled', 'missed'],
  in_progress: ['completed', 'cancelled', 'missed'],
  completed: ['rescheduled'],
  cancelled: [], // Terminal state
  missed: ['rescheduled', 'completed'], // Can be rescheduled or marked as completed late
  rescheduled: ['scheduled', 'cancelled'] // Can be rescheduled again or cancelled
}

// Lead status transitions based on follow-up outcomes
export const SUGGESTED_LEAD_STATUS_BY_OUTCOME: Record<string, LeadStatus[]> = {
  // Positive outcomes
  'interested': ['QUALIFIED', 'PROPOSAL'],
  'qualified': ['QUALIFIED', 'PROPOSAL'],
  'ready': ['PROPOSAL', 'NEGOTIATION'],
  'proposal': ['PROPOSAL', 'NEGOTIATION'],
  'negotiation': ['NEGOTIATION', 'WON'],
  'accepted': ['WON'],
  'purchased': ['WON'],
  'deal': ['WON'],
  'signed': ['WON'],
  
  // Negative outcomes
  'not interested': ['LOST'],
  'declined': ['LOST'],
  'rejected': ['LOST'],
  'competitor': ['LOST'],
  'budget': ['LOST'],
  'no budget': ['LOST'],
  
  // Neutral/follow-up outcomes
  'call back': ['CONTACTED'],
  'follow up': ['CONTACTED'],
  'thinking': ['QUALIFIED'],
  'consider': ['QUALIFIED'],
  'busy': ['CONTACTED'],
  'meeting': ['QUALIFIED']
}

// Smart filtering types
export interface SmartFilters {
  overdue: boolean
  today: boolean
  thisWeek: boolean
  upcoming: boolean
}

export interface FollowUpFilters {
  status?: FollowUpStatus | FollowUpStatus[]
  leadId?: number
  startDate?: string
  endDate?: string
  priority?: string
  smart?: Partial<SmartFilters>
}
