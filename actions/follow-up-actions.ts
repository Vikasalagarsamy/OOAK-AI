"use server"

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { FollowUpStatus, FollowUpWithLead } from "@/types/follow-up"
import { getCurrentUser } from "@/lib/auth-utils"
import { logActivity } from "@/services/activity-service"
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
  priority: z.enum(["low", "medium", "high"]),
  interaction_summary: z.string().optional(),
})

export type FollowUpFormData = z.infer<typeof FollowUpSchema>

export type FollowupType = (typeof VALID_FOLLOWUP_TYPES)[number]

export async function getFollowUps(filters?: {
  status?: FollowUpStatus | FollowUpStatus[]
  leadId?: number
  startDate?: string
  endDate?: string
  priority?: string
}): Promise<FollowUpWithLead[]> {
  const supabase = createClient()

  let query = supabase.from("lead_followups").select(`
      *,
      lead:leads(lead_number, client_name)
    `)

  // Apply filters
  if (filters) {
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status)
      } else {
        query = query.eq("status", filters.status)
      }
    }

    if (filters.leadId) {
      query = query.eq("lead_id", filters.leadId)
    }

    if (filters.startDate) {
      query = query.gte("scheduled_at", filters.startDate)
    }

    if (filters.endDate) {
      query = query.lte("scheduled_at", filters.endDate)
    }

    if (filters.priority) {
      query = query.eq("priority", filters.priority)
    }
  }

  // Order by scheduled date
  query = query.order("scheduled_at", { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error("Error fetching follow-ups:", error)
    throw new Error("Failed to fetch follow-ups")
  }

  return data as FollowUpWithLead[]
}

export async function getFollowUpById(id: number): Promise<FollowUpWithLead | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("lead_followups")
    .select(`
      *,
      lead:leads(lead_number, client_name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching follow-up:", error)
    return null
  }

  return data as FollowUpWithLead
}

// Add this function back to maintain backward compatibility
export async function createFollowUp(
  formData: FollowUpFormData,
): Promise<{ success: boolean; message: string; id?: number; error?: any }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Validate the lead exists
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name")
      .eq("id", formData.lead_id)
      .single()

    if (leadError || !lead) {
      console.error("Error validating lead:", leadError)
      return { success: false, message: "Invalid lead ID" }
    }

    // Validate follow-up type
    if (!VALID_FOLLOWUP_TYPES.includes(formData.followup_type as FollowupType)) {
      return {
        success: false,
        message: `Invalid follow-up type. Must be one of: ${VALID_FOLLOWUP_TYPES.join(", ")}`,
      }
    }

    // Ensure proper data types for database insertion
    const followUpData = {
      lead_id: Number(formData.lead_id),
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      followup_type: String(formData.followup_type),
      notes: formData.notes ? String(formData.notes) : null,
      priority: String(formData.priority),
      interaction_summary: formData.interaction_summary ? String(formData.interaction_summary) : null,
      status: "scheduled" as FollowUpStatus,
      created_by: currentUser.id ? String(currentUser.id) : null, // Explicitly convert to string
      follow_up_required: false,
      next_follow_up_date: null,
    }

    console.log("Inserting follow-up data:", followUpData)

    // Use direct SQL for debugging purposes
    const { data, error } = await supabase.from("lead_followups").insert(followUpData).select()

    if (error) {
      console.error("Error creating follow-up:", error)
      return {
        success: false,
        message: `Failed to create follow-up: ${error.message}`,
        error: error,
      }
    }

    // Log activity
    await logActivity({
      actionType: "create",
      entityType: "follow_up",
      entityId: data[0].id.toString(),
      entityName: `Follow-up for Lead ${lead.lead_number}`,
      description: `Scheduled a ${formData.followup_type} follow-up for ${new Date(formData.scheduled_at).toLocaleString()}`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath("/follow-ups")
    revalidatePath(`/leads/${formData.lead_id}`)

    return {
      success: true,
      message: "Follow-up scheduled successfully",
      id: data[0].id,
    }
  } catch (error) {
    console.error("Error creating follow-up:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error,
    }
  }
}

export async function scheduleLeadFollowup(data: {
  leadId: number
  scheduledAt: string
  followupType: string
  notes?: string
  priority: string
  summary?: string
}) {
  const supabase = createClient()

  try {
    console.log("Scheduling follow-up with data:", data)

    // Validate input data
    if (!data.leadId || isNaN(Number(data.leadId))) {
      return { success: false, message: "Invalid lead ID" }
    }

    if (!data.scheduledAt || new Date(data.scheduledAt).toString() === "Invalid Date") {
      return { success: false, message: "Invalid scheduled date" }
    }

    if (!VALID_FOLLOWUP_TYPES.includes(data.followupType as FollowupType)) {
      return { success: false, message: "Invalid follow-up type" }
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("No authenticated user found")
      return { success: false, message: "Authentication required" }
    }

    // Verify the lead exists
    const { data: leadExists, error: leadCheckError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", data.leadId)
      .single()

    if (leadCheckError || !leadExists) {
      console.error("Lead does not exist:", leadCheckError)
      return { success: false, message: "The specified lead does not exist" }
    }

    // Insert the follow-up
    const { data: followup, error } = await supabase
      .from("lead_followups") // Ensure this matches your actual table name
      .insert({
        lead_id: data.leadId,
        scheduled_at: data.scheduledAt,
        followup_type: data.followupType,
        notes: data.notes || "",
        priority: data.priority,
        interaction_summary: data.summary || "",
        status: "scheduled",
        created_by: String(user.id),
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error inserting follow-up:", error)

      // Check for specific error types
      if (error.code === "23505") {
        return { success: false, message: "A follow-up with these details already exists" }
      } else if (error.code === "23503") {
        return { success: false, message: "Referenced lead or user does not exist" }
      }

      return { success: false, message: `Failed to schedule follow-up: ${error.message}` }
    }

    console.log("Follow-up scheduled successfully:", followup)

    // Revalidate relevant paths to update UI
    revalidatePath(`/sales/lead/${data.leadId}`)
    revalidatePath("/sales/my-leads")
    revalidatePath("/follow-ups")

    return {
      success: true,
      message: "Follow-up scheduled successfully",
      data: followup,
    }
  } catch (error: any) {
    console.error("Unexpected error in scheduleLeadFollowup:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error.message || String(error)}`,
    }
  }
}

export async function updateFollowUpStatus(
  id: number,
  status: FollowUpStatus,
  data?: {
    completed_at?: string
    outcome?: string
    duration_minutes?: number
    follow_up_required?: boolean
    next_follow_up_date?: string
  },
): Promise<{ success: boolean; message: string; error?: any }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Get the current follow-up
    const { data: followUp, error: fetchError } = await supabase
      .from("lead_followups")
      .select(`
        id, 
        status, 
        lead_id,
        lead:leads(lead_number, client_name)
      `)
      .eq("id", id)
      .single()

    if (fetchError || !followUp) {
      console.error("Error fetching follow-up:", fetchError)
      return { success: false, message: "Follow-up not found", error: fetchError }
    }

    const updateData: any = {
      status: String(status),
      updated_by: currentUser.id ? String(currentUser.id) : null, // Explicit string conversion
      updated_at: new Date().toISOString(),
    }

    // Add additional data if provided
    if (data) {
      if (status === "completed") {
        updateData.completed_at = data.completed_at
          ? new Date(data.completed_at).toISOString()
          : new Date().toISOString()
        updateData.completed_by = currentUser.id ? String(currentUser.id) : null // Explicit string conversion
        updateData.outcome = data.outcome ? String(data.outcome) : null
        updateData.duration_minutes = data.duration_minutes ? Number(data.duration_minutes) : null
      }

      if (data.follow_up_required !== undefined) {
        updateData.follow_up_required = Boolean(data.follow_up_required)
        updateData.next_follow_up_date = data.next_follow_up_date
          ? new Date(data.next_follow_up_date).toISOString()
          : null
      }
    }

    console.log("Updating follow-up with data:", updateData)

    const { error: updateError } = await supabase.from("lead_followups").update(updateData).eq("id", id)

    if (updateError) {
      console.error("Error updating follow-up:", updateError)
      return {
        success: false,
        message: `Failed to update follow-up: ${updateError.message}`,
        error: updateError,
      }
    }

    // Log activity
    await logActivity({
      actionType: "update",
      entityType: "follow_up",
      entityId: id.toString(),
      entityName: `Follow-up for Lead ${followUp.lead.lead_number}`,
      description: `Updated follow-up status from ${followUp.status} to ${status}`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath("/follow-ups")
    revalidatePath(`/leads/${followUp.lead_id}`)

    return { success: true, message: "Follow-up updated successfully" }
  } catch (error) {
    console.error("Error updating follow-up:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error,
    }
  }
}

export async function deleteFollowUp(id: number): Promise<{ success: boolean; message: string; error?: any }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Get the follow-up details for logging
    const { data: followUp, error: fetchError } = await supabase
      .from("lead_followups")
      .select(`
        id, 
        lead_id,
        lead:leads(lead_number, client_name)
      `)
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching follow-up:", fetchError)
      return { success: false, message: "Follow-up not found", error: fetchError }
    }

    const { error: deleteError } = await supabase.from("lead_followups").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting follow-up:", deleteError)
      return {
        success: false,
        message: `Failed to delete follow-up: ${deleteError.message}`,
        error: deleteError,
      }
    }

    // Log activity
    await logActivity({
      actionType: "delete",
      entityType: "follow_up",
      entityId: id.toString(),
      entityName: `Follow-up for Lead ${followUp.lead.lead_number}`,
      description: `Deleted follow-up for lead ${followUp.lead.client_name}`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath("/follow-ups")
    revalidatePath(`/leads/${followUp.lead_id}`)

    return { success: true, message: "Follow-up deleted successfully" }
  } catch (error) {
    console.error("Error deleting follow-up:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error,
    }
  }
}

export async function getUpcomingFollowUps(days = 7): Promise<FollowUpWithLead[]> {
  const supabase = createClient()

  const startDate = new Date().toISOString()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  const { data, error } = await supabase
    .from("lead_followups")
    .select(`
      *,
      lead:leads(lead_number, client_name)
    `)
    .eq("status", "scheduled")
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate.toISOString())
    .order("scheduled_at", { ascending: true })

  if (error) {
    console.error("Error fetching upcoming follow-ups:", error)
    throw new Error("Failed to fetch upcoming follow-ups")
  }

  return data as FollowUpWithLead[]
}

export async function getFollowUpStats(): Promise<{
  total: number
  completed: number
  scheduled: number
  missed: number
  cancelled: number
  byMethod: Record<string, number>
}> {
  const supabase = createClient()

  // Get counts by status
  const { data: statusCounts, error: statusError } = await supabase
    .from("lead_followups")
    .select("status, count", { count: "exact" })
    .group("status")

  if (statusError) {
    console.error("Error fetching follow-up stats:", statusError)
    throw new Error("Failed to fetch follow-up statistics")
  }

  // Get counts by followup type
  const { data: methodCounts, error: methodError } = await supabase
    .from("lead_followups")
    .select("followup_type, count", { count: "exact" })
    .group("followup_type")

  if (methodError) {
    console.error("Error fetching follow-up method stats:", methodError)
    throw new Error("Failed to fetch follow-up method statistics")
  }

  // Calculate total
  const { count: total, error: totalError } = await supabase
    .from("lead_followups")
    .select("*", { count: "exact", head: true })

  if (totalError) {
    console.error("Error fetching total follow-ups:", totalError)
    throw new Error("Failed to fetch total follow-ups")
  }

  // Process the results
  const stats = {
    total: total || 0,
    completed: 0,
    scheduled: 0,
    missed: 0,
    cancelled: 0,
    byMethod: {} as Record<string, number>,
  }

  statusCounts?.forEach((item) => {
    const status = item.status as FollowUpStatus
    const count = Number.parseInt(item.count as unknown as string)
    stats[status] = count
  })

  methodCounts?.forEach((item) => {
    const method = item.followup_type
    const count = Number.parseInt(item.count as unknown as string)
    stats.byMethod[method] = count
  })

  return stats
}

// Add a diagnostic function to help troubleshoot follow-up creation issues
export async function testFollowUpCreation(leadId: number, followupType = "phone") {
  const supabase = createClient()

  try {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Create minimal test data
    const testData = {
      lead_id: Number(leadId),
      scheduled_at: new Date().toISOString(),
      followup_type: followupType,
      status: "scheduled",
      priority: "medium",
      created_by: user?.id ? String(user.id) : null,
    }

    console.log("Testing follow-up creation with data:", testData)

    const { data, error } = await supabase.from("lead_followups").insert(testData).select()

    if (error) {
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        error: error,
      }
    }

    return {
      success: true,
      message: "Test follow-up creation succeeded",
      data: data,
    }
  } catch (error: any) {
    return {
      success: false,
      message: "Unexpected error during test",
      error: error.message || String(error),
    }
  }
}
