import type { VALID_FOLLOWUP_TYPES } from "@/actions/follow-up-actions"

export type FollowUpStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "missed" | "rescheduled"
export type FollowupType = (typeof VALID_FOLLOWUP_TYPES)[number]
export type Priority = "low" | "medium" | "high" | "urgent"

export interface FollowUp {
  id: number
  lead_id: number
  scheduled_at: string
  completed_at: string | null
  followup_type: FollowupType
  interaction_summary: string | null
  status: FollowUpStatus
  outcome: string | null
  notes: string | null
  priority: Priority
  created_by: string
  created_at: string
  updated_by: string | null
  updated_at: string | null
  completed_by: string | null
  duration_minutes: number | null
  follow_up_required: boolean
  next_follow_up_date: string | null
}

export interface Lead {
  id: number
  lead_number: string
  client_name: string
  status: string
  company_id: number
  branch_id: number | null
  assigned_to: number | null
}

export interface FollowUpFormData {
  lead_id: number
  scheduled_at: string
  followup_type: FollowupType // Use the constrained type here
  notes?: string
  priority: string
  interaction_summary?: string
}

export interface FollowUpWithLead extends FollowUp {
  lead: {
    lead_number: string
    client_name: string
  }
}
