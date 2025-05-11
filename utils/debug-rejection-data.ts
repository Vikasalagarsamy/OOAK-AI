"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Debug utility to check rejection data for a specific lead
 */
export async function debugLeadRejectionData(leadId: number) {
  try {
    const supabase = createClient()

    // Get lead data
    const { data: lead, error: leadError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (leadError) {
      console.error("Error fetching lead:", leadError)
      return { success: false, message: leadError.message }
    }

    // Get rejection activities
    const { data: activities, error: activitiesError } = await supabase
      .from("activities")
      .select("*")
      .eq("entity_id", leadId.toString())
      .eq("action_type", "reject")
      .order("created_at", { ascending: false })

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
      return {
        success: false,
        message: activitiesError.message,
        lead,
      }
    }

    return {
      success: true,
      lead,
      activities,
      analysis: {
        hasRejectionReason: Boolean(lead.rejection_reason),
        hasRejectedAt: Boolean(lead.rejected_at),
        hasRejectedBy: Boolean(lead.rejected_by),
        activityCount: activities.length,
        mostRecentActivity: activities[0] || null,
      },
    }
  } catch (error) {
    console.error("Error in debugLeadRejectionData:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

/**
 * Fix a specific lead's rejection data by syncing it with the most recent rejection activity
 */
export async function syncLeadRejectionData(leadId: number) {
  try {
    const supabase = createClient()

    // Get the most recent rejection activity
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("*")
      .eq("entity_id", leadId.toString())
      .eq("action_type", "reject")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (activityError) {
      console.error("Error fetching rejection activity:", activityError)
      return { success: false, message: "No rejection activity found" }
    }

    // Extract rejection reason from description
    let rejectionReason = "No reason provided"
    if (activity.description.includes("Reason:")) {
      rejectionReason = activity.description.split("Reason:")[1].trim()
    }

    // Update the lead with the correct rejection data
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        rejection_reason: rejectionReason,
        rejected_at: activity.created_at,
        rejected_by: activity.user_id,
      })
      .eq("id", leadId)

    if (updateError) {
      console.error("Error updating lead:", updateError)
      return { success: false, message: updateError.message }
    }

    return {
      success: true,
      message: "Lead rejection data synchronized successfully",
      rejectionReason,
      rejectedAt: activity.created_at,
      rejectedBy: activity.user_id,
    }
  } catch (error) {
    console.error("Error in syncLeadRejectionData:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
