import { z } from "zod"

export const VALID_FOLLOWUP_TYPES = [
  "email",
  "phone",
  "in_person",
  "video_call",
  "text_message",
  "social_media",
  "other",
] as const

export const FollowUpSchema = z.object({
  lead_id: z.number(),
  scheduled_at: z.string().datetime(),
  followup_type: z.enum(VALID_FOLLOWUP_TYPES),
  notes: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  interaction_summary: z.string().optional(),
})

export type FollowUpFormData = z.infer<typeof FollowUpSchema>

export type FollowupType = (typeof VALID_FOLLOWUP_TYPES)[number] 