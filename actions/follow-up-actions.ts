"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { FollowUpFormData, FollowUpStatus, FollowUpWithLead } from "@/types/follow-up"
import { getCurrentUser } from "@/lib/auth-utils"
import { logActivity } from "@/services/activity-service"

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

export async function createFollowUp(
  formData: FollowUpFormData,
): Promise<{ success: boolean; message: string; id?: number }> {
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

    const followUpData = {
      lead_id: formData.lead_id,
      scheduled_at: formData.scheduled_at,
      contact_method: formData.contact_method,
      notes: formData.notes || null,
      priority: formData.priority,
      interaction_summary: formData.interaction_summary || null,
      status: "scheduled" as FollowUpStatus,
      created_by: currentUser.id,
      follow_up_required: false,
    }

    const { data, error } = await supabase.from("lead_followups").insert(followUpData).select()

    if (error) {
      console.error("Error creating follow-up:", error)
      return { success: false, message: `Failed to create follow-up: ${error.message}` }
    }

    // Log activity
    await logActivity({
      actionType: "create",
      entityType: "follow_up",
      entityId: data[0].id.toString(),
      entityName: `Follow-up for Lead ${lead.lead_number}`,
      description: `Scheduled a ${formData.contact_method} follow-up for ${new Date(formData.scheduled_at).toLocaleString()}`,
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
    return { success: false, message: "An unexpected error occurred" }
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
): Promise<{ success: boolean; message: string }> {
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
      return { success: false, message: "Follow-up not found" }
    }

    const updateData: any = {
      status,
      updated_by: currentUser.id,
      updated_at: new Date().toISOString(),
    }

    // Add additional data if provided
    if (data) {
      if (status === "completed") {
        updateData.completed_at = data.completed_at || new Date().toISOString()
        updateData.completed_by = currentUser.id
        updateData.outcome = data.outcome
        updateData.duration_minutes = data.duration_minutes
      }

      if (data.follow_up_required !== undefined) {
        updateData.follow_up_required = data.follow_up_required
        updateData.next_follow_up_date = data.next_follow_up_date
      }
    }

    const { error: updateError } = await supabase.from("lead_followups").update(updateData).eq("id", id)

    if (updateError) {
      console.error("Error updating follow-up:", updateError)
      return { success: false, message: `Failed to update follow-up: ${updateError.message}` }
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
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function deleteFollowUp(id: number): Promise<{ success: boolean; message: string }> {
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
      return { success: false, message: "Follow-up not found" }
    }

    const { error: deleteError } = await supabase.from("lead_followups").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting follow-up:", deleteError)
      return { success: false, message: `Failed to delete follow-up: ${deleteError.message}` }
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
    return { success: false, message: "An unexpected error occurred" }
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

  // Get counts by contact method
  const { data: methodCounts, error: methodError } = await supabase
    .from("lead_followups")
    .select("contact_method, count", { count: "exact" })
    .group("contact_method")

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
    const method = item.contact_method
    const count = Number.parseInt(item.count as unknown as string)
    stats.byMethod[method] = count
  })

  return stats
}
