export type FollowUpStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "missed" | "rescheduled"
export type FollowUpType = "email" | "phone" | "in_person" | "video_call" | "text_message" | "social_media" | "other"
export type Priority = "low" | "medium" | "high" | "urgent"

export interface FollowUp {
  id: number
  lead_id: number
  scheduled_at: string
  completed_at: string | null
  followup_type: FollowUpType
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
  followup_type: FollowUpType
  notes?: string
  priority: Priority
  interaction_summary?: string
}

export interface FollowUpWithLead extends FollowUp {
  lead: {
    lead_number: string
    client_name: string
  }
}
