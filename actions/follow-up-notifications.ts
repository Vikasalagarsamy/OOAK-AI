"use server"

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"
import { logActivity } from "@/services/activity-service"
import { addDays, addMinutes, format, parseISO } from "date-fns"

// Function to get upcoming follow-ups that need notifications
export async function getUpcomingNotifications(minutesThreshold = 15) {
  const supabase = createClient()

  try {
    const now = new Date()
    const thresholdTime = addMinutes(now, minutesThreshold)

    // Get follow-ups that are scheduled within the threshold time
    const { data, error } = await supabase
      .from("lead_followups")
      .select(`
        id,
        scheduled_at,
        followup_type,
        lead_id,
        interaction_summary,
        priority,
        lead:leads(lead_number, client_name),
        created_by
      `)
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", thresholdTime.toISOString())
      .order("scheduled_at", { ascending: true })

    if (error) {
      console.error("Error fetching upcoming notifications:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      notifications: data.map((item) => ({
        id: item.id,
        scheduledAt: item.scheduled_at,
        followupType: item.followup_type,
        leadId: item.lead_id,
        leadNumber: item.lead?.lead_number,
        clientName: item.lead?.client_name,
        summary: item.interaction_summary,
        priority: item.priority,
        createdBy: item.created_by,
        timeUntil: format(parseISO(item.scheduled_at), "h:mm a"),
      })),
    }
  } catch (error) {
    console.error("Error in getUpcomingNotifications:", error)
    return { success: false, error: "Failed to fetch notifications" }
  }
}

// Function to get overdue follow-ups
export async function getOverdueFollowUps() {
  const supabase = createClient()

  try {
    const now = new Date()

    // Get follow-ups that are scheduled in the past but still have status "scheduled"
    const { data, error } = await supabase
      .from("lead_followups")
      .select(`
        id,
        scheduled_at,
        followup_type,
        lead_id,
        interaction_summary,
        priority,
        lead:leads(lead_number, client_name),
        created_by
      `)
      .eq("status", "scheduled")
      .lt("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: false })

    if (error) {
      console.error("Error fetching overdue follow-ups:", error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      overdue: data.map((item) => ({
        id: item.id,
        scheduledAt: item.scheduled_at,
        followupType: item.followup_type,
        leadId: item.lead_id,
        leadNumber: item.lead?.lead_number,
        clientName: item.lead?.client_name,
        summary: item.interaction_summary,
        priority: item.priority,
        createdBy: item.created_by,
        overdueDays: Math.floor((now.getTime() - new Date(item.scheduled_at).getTime()) / (1000 * 60 * 60 * 24)),
      })),
    }
  } catch (error) {
    console.error("Error in getOverdueFollowUps:", error)
    return { success: false, error: "Failed to fetch overdue follow-ups" }
  }
}

// Function to get daily summary of follow-ups
export async function getDailySummary() {
  const supabase = createClient()

  try {
    const now = new Date()
    const tomorrow = addDays(now, 1)

    // Get today's completed follow-ups
    const { data: completedToday, error: completedError } = await supabase
      .from("lead_followups")
      .select("id")
      .eq("status", "completed")
      .gte("completed_at", format(now, "yyyy-MM-dd"))
      .count()

    if (completedError) {
      console.error("Error fetching completed follow-ups:", completedError)
    }

    // Get upcoming follow-ups for tomorrow
    const { data: upcomingTomorrow, error: upcomingError } = await supabase
      .from("lead_followups")
      .select(`
        id,
        scheduled_at,
        followup_type,
        lead:leads(lead_number, client_name)
      `)
      .eq("status", "scheduled")
      .gte("scheduled_at", format(now, "yyyy-MM-dd"))
      .lt("scheduled_at", format(tomorrow, "yyyy-MM-dd"))
      .order("scheduled_at", { ascending: true })

    if (upcomingError) {
      console.error("Error fetching upcoming follow-ups:", upcomingError)
    }

    // Get overdue follow-ups
    const { data: overdueCount, error: overdueError } = await supabase
      .from("lead_followups")
      .select("id")
      .eq("status", "scheduled")
      .lt("scheduled_at", format(now, "yyyy-MM-dd"))
      .count()

    if (overdueError) {
      console.error("Error fetching overdue follow-ups:", overdueError)
    }

    return {
      success: true,
      summary: {
        completedToday: completedToday || 0,
        upcomingTomorrow: upcomingTomorrow || [],
        overdueCount: overdueCount || 0,
        date: format(now, "EEEE, MMMM d, yyyy"),
      },
    }
  } catch (error) {
    console.error("Error in getDailySummary:", error)
    return { success: false, error: "Failed to generate daily summary" }
  }
}

// Function to mark a follow-up as missed if it's overdue
export async function markOverdueAsMissed() {
  const supabase = createClient()

  try {
    const now = new Date()

    // Update follow-ups that are scheduled in the past but still have status "scheduled"
    const { data, error } = await supabase
      .from("lead_followups")
      .update({
        status: "missed",
        updated_at: now.toISOString(),
      })
      .eq("status", "scheduled")
      .lt("scheduled_at", now.toISOString())
      .select("id, lead_id")

    if (error) {
      console.error("Error marking overdue follow-ups as missed:", error)
      return { success: false, error: error.message }
    }

    // Log activity for each missed follow-up
    if (data && data.length > 0) {
      const currentUser = await getCurrentUser()
      const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "System"

      for (const item of data) {
        await logActivity({
          actionType: "status_change",
          entityType: "follow_up",
          entityId: item.id.toString(),
          entityName: `Follow-up for Lead ${item.lead_id}`,
          description: `Follow-up automatically marked as missed`,
          userName,
        })
      }

      // Revalidate paths
      revalidatePath("/follow-ups")
    }

    return {
      success: true,
      count: data?.length || 0,
    }
  } catch (error) {
    console.error("Error in markOverdueAsMissed:", error)
    return { success: false, error: "Failed to mark overdue follow-ups as missed" }
  }
}
