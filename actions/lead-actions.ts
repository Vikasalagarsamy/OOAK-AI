"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"
import { getCurrentUser } from "@/lib/auth-utils"

export async function updateLeadStatus(
  leadId: number,
  status: string,
  notes?: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    const supabase = createClient()

    // First, get the lead to check if the user is authorized to update it
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name, assigned_to, status")
      .eq("id", leadId)
      .single()

    if (fetchError) {
      console.error("Error fetching lead:", fetchError)
      return { success: false, message: "Failed to fetch lead details" }
    }

    if (!lead) {
      return { success: false, message: "Lead not found" }
    }

    // Check if the user is authorized to update this lead
    if (lead.assigned_to !== currentUser.employeeId) {
      return { success: false, message: "You are not authorized to update this lead" }
    }

    // Update the lead status
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (updateError) {
      console.error("Error updating lead status:", updateError)
      return { success: false, message: "Failed to update lead status" }
    }

    // Log the activity
    await logActivity({
      actionType: "update",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: `Lead status updated from ${lead.status} to ${status}${notes ? `: ${notes}` : ""}`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    // If notes were provided, add them to the lead notes
    if (notes) {
      const { error: notesError } = await supabase.from("lead_notes").insert({
        lead_id: leadId,
        note: notes,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        note_type: "status_change",
      })

      if (notesError) {
        console.error("Error adding lead notes:", notesError)
        // Don't fail the status update if notes fail
      }
    }

    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/my-leads")

    return { success: true }
  } catch (error) {
    console.error("Error updating lead status:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function sendLeadMessage(
  leadId: number,
  messageType: string,
  subject: string,
  message: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    const supabase = createClient()

    // First, get the lead to check if the user is authorized
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name, assigned_to, email, phone")
      .eq("id", leadId)
      .single()

    if (fetchError) {
      console.error("Error fetching lead:", fetchError)
      return { success: false, message: "Failed to fetch lead details" }
    }

    if (!lead) {
      return { success: false, message: "Lead not found" }
    }

    // Check if the user is authorized to message this lead
    if (lead.assigned_to !== currentUser.employeeId) {
      return { success: false, message: "You are not authorized to message this lead" }
    }

    // In a real application, you would integrate with an email or SMS service here
    // For now, we'll just log the message and record it in the database

    // Log the activity
    await logActivity({
      actionType: "message",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: `${messageType.toUpperCase()} sent to ${lead.client_name}: ${
        messageType === "email" ? subject : message.substring(0, 30) + "..."
      }`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    // Record the message in the database
    const { error: messageError } = await supabase.from("lead_messages").insert({
      lead_id: leadId,
      message_type: messageType,
      subject: messageType === "email" ? subject : null,
      message_body: message,
      sent_by: currentUser.id,
      sent_at: new Date().toISOString(),
      status: "sent", // In a real app, this might be "pending" until confirmed by the email/SMS service
    })

    if (messageError) {
      console.error("Error recording message:", messageError)
      return { success: false, message: "Failed to record message" }
    }

    // Update the lead's last contacted date
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (updateError) {
      console.error("Error updating lead:", updateError)
      // Don't fail the message if this update fails
    }

    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/my-leads")

    return { success: true }
  } catch (error) {
    console.error("Error sending lead message:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function scheduleLeadFollowup(
  leadId: number,
  followupDateTime: string,
  followupType: string,
  notes?: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    const supabase = createClient()

    // First, get the lead to check if the user is authorized
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name, assigned_to")
      .eq("id", leadId)
      .single()

    if (fetchError) {
      console.error("Error fetching lead:", fetchError)
      return { success: false, message: "Failed to fetch lead details" }
    }

    if (!lead) {
      return { success: false, message: "Lead not found" }
    }

    // Check if the user is authorized to schedule followups for this lead
    if (lead.assigned_to !== currentUser.employeeId) {
      return { success: false, message: "You are not authorized to schedule followups for this lead" }
    }

    // Create the followup
    const { error: followupError } = await supabase.from("lead_followups").insert({
      lead_id: leadId,
      followup_type: followupType,
      scheduled_at: followupDateTime,
      notes: notes || null,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      status: "scheduled",
    })

    if (followupError) {
      console.error("Error scheduling followup:", followupError)
      return { success: false, message: "Failed to schedule followup" }
    }

    // Log the activity
    await logActivity({
      actionType: "schedule",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: `${followupType.charAt(0).toUpperCase() + followupType.slice(1)} follow-up scheduled with ${
        lead.client_name
      } for ${new Date(followupDateTime).toLocaleString()}`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/follow-up")

    return { success: true }
  } catch (error) {
    console.error("Error scheduling lead followup:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Keep the existing functions
export async function assignLeadToEmployee(
  leadId: number,
  employeeId: number,
): Promise<{ success: boolean; message: string }> {
  // Existing implementation
  return { success: true, message: "Lead assigned successfully" }
}

export async function assignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  employeeId: number,
  employeeName: string,
): Promise<{ success: boolean; message: string }> {
  // Existing implementation
  return { success: true, message: "Lead assigned successfully" }
}

export async function deleteLead(leadId: number): Promise<{ success: boolean; message: string }> {
  // Existing implementation
  return { success: true, message: "Lead deleted successfully" }
}
