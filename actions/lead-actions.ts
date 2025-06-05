"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"
import { logActivity } from "@/services/activity-service"
import { triggerLeadAssignmentTasks } from "@/actions/lead-task-integration-hooks"

// Update the updateLeadStatus function to handle rejected leads
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
      .select(`
        id, 
        lead_number, 
        client_name, 
        assigned_to, 
        status, 
        company_id,
        branch_id
      `)
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

    // Check if the rejection_reason column exists
    let hasRejectionColumns = false
    try {
      const { data: columnExists, error: columnError } = await supabase.rpc("column_exists", {
        table_name: "leads",
        column_name: "rejection_reason",
      })

      if (!columnError && columnExists) {
        hasRejectionColumns = true
      }
    } catch (error) {
      console.error("Error checking for rejection_reason column:", error)
      // Continue with the assumption that the column might not exist
    }

    // Prepare update data based on status and column existence
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    // If rejecting and columns exist, add rejection data
    if (status === "REJECTED" && hasRejectionColumns) {
      updateData.rejection_reason = notes || "No reason provided"
      updateData.rejected_at = new Date().toISOString()
      // Set rejected_by to the user's ID (UUID) instead of their name
      updateData.rejected_by = currentUser.id
    }

    // Update lead status
    const { error: updateError } = await supabase.from("leads").update(updateData).eq("id", leadId)

    if (updateError) {
      console.error("Error updating lead status:", updateError)
      return { success: false, message: "Failed to update lead status" }
    }

    // Log the activity regardless of status
    const activityDescription =
      status === "REJECTED"
        ? `Lead rejected. Reason: ${notes || "No reason provided"}`
        : `Lead status updated from ${lead.status} to ${status}`

    await logActivity({
      actionType: status === "REJECTED" ? "reject" : "update",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: activityDescription,
      userName: currentUser.username || 'Unknown User',
    })

    // Revalidate paths
    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/manage-lead")

    return { success: true }
  } catch (error) {
    console.error("Error updating lead status:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Add the reassignRejectedLead function
export async function reassignRejectedLead(
  leadId: number,
  newCompanyId: number,
  newBranchId: number | null,
): Promise<{ success: boolean; message?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    const supabase = createClient()

    // First, get the lead to check if it's rejected
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select(`
        id, 
        lead_number, 
        client_name, 
        status, 
        company_id,
        companies!leads_company_id_fkey(name),
        branch_id,
        branches(name),
        rejection_reason
      `)
      .eq("id", leadId)
      .single()

    if (fetchError) {
      console.error("Error fetching lead:", fetchError)
      return { success: false, message: "Failed to fetch lead details" }
    }

    if (!lead) {
      return { success: false, message: "Lead not found" }
    }

    if (lead.status !== "REJECTED") {
      return { success: false, message: "Only rejected leads can be reassigned" }
    }

    // Get the new company name for logging
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .select("name")
      .eq("id", newCompanyId)
      .single()

    if (companyError) {
      console.error("Error fetching new company:", companyError)
      // Continue anyway, this is just for logging
    }

    // Get the new branch name for logging
    let newBranchName = null
    if (newBranchId) {
      const { data: newBranch, error: branchError } = await supabase
        .from("branches")
        .select("name")
        .eq("id", newBranchId)
        .single()

      if (!branchError && newBranch) {
        newBranchName = newBranch.name
      }
    }

    // Check if the rejection_reason column exists
    let hasRejectionColumns = false
    try {
      const { data: columnExists, error: columnError } = await supabase.rpc("column_exists", {
        table_name: "leads",
        column_name: "rejection_reason",
      })

      if (!columnError && columnExists) {
        hasRejectionColumns = true
      }
    } catch (error) {
      console.error("Error checking for rejection_reason column:", error)
      // Continue with the assumption that the column might not exist
    }

    // Prepare update data
    const updateData: any = {
      company_id: newCompanyId,
      branch_id: newBranchId,
      status: "UNASSIGNED", // Mark as unassigned
      assigned_to: null, // Remove assignment
      updated_at: new Date().toISOString(),
    }

    // If rejection columns exist, clear them
    if (hasRejectionColumns) {
      updateData.rejection_reason = null
      updateData.rejected_at = null
      updateData.rejected_by = null
    }

    // Update the lead
    const { error: updateError } = await supabase.from("leads").update(updateData).eq("id", leadId)

    if (updateError) {
      console.error("Error reassigning lead:", updateError)
      return { success: false, message: "Failed to reassign lead" }
    }

    // Create reassignment description for activity log
    const rejectionReason = lead.rejection_reason || "Unknown reason"
    const reassignmentDescription = `Lead reassigned from ${lead.companies?.name || "previous company"}${
      lead.branches?.name ? ` (${lead.branches.name})` : ""
    } to ${newCompany?.name || "new company"}${
      newBranchName ? ` (${newBranchName})` : ""
    }. Original rejection reason: ${rejectionReason}. Status changed to UNASSIGNED.`

    // Log the activity
    await logActivity({
      actionType: "reassign",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: reassignmentDescription,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/manage-lead")
    revalidatePath("/sales/unassigned-lead")

    return { success: true }
  } catch (error) {
    console.error("Error reassigning rejected lead:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function assignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  employeeId: number,
  employeeName: string,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    console.log(`Assigning lead ${leadId} to employee ${employeeId}`)

    // Get the lead data before updating for AI task generation
    const { data: leadData, error: fetchError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single()

    if (fetchError) {
      console.error("Error fetching lead data:", fetchError)
      return { success: false, message: `Failed to fetch lead: ${fetchError.message}` }
    }

    // Update the lead
    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeId,
        status: "ASSIGNED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error assigning lead:", error)
      return { success: false, message: `Failed to assign lead: ${error.message}` }
    }

    // Log the activity
    const currentUser = await getCurrentUser()
    await logActivity({
      actionType: "assign",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: leadNumber,
      description: `Lead ${leadNumber} (${clientName}) assigned to ${employeeName}`,
      userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "System",
    })

    // 🤖 TRIGGER AI TASK GENERATION
    try {
      const updatedLeadData = {
        ...leadData,
        assigned_to: employeeId,
        status: "ASSIGNED",
        updated_at: new Date().toISOString()
      }
      
      console.log('🚀 Triggering AI task generation for lead assignment...')
      const aiResult = await triggerLeadAssignmentTasks(
        leadId,
        updatedLeadData,
        currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "System"
      )
      
      if (aiResult.success && aiResult.tasksGenerated > 0) {
        console.log(`✅ AI generated ${aiResult.tasksGenerated} task(s) for lead ${leadNumber}`)
      } else {
        console.log(`ℹ️ No AI tasks generated for lead ${leadNumber}: ${aiResult.message}`)
      }
    } catch (aiError) {
      console.error('⚠️ AI task generation failed (continuing with assignment):', aiError)
      // Don't fail the entire assignment if AI task generation fails
    }

    revalidatePath("/sales/unassigned-lead")
    revalidatePath("/sales/manage-lead")
    revalidatePath(`/sales/lead/${leadId}`)

    return { success: true, message: `Lead ${leadNumber} assigned to ${employeeName}` }
  } catch (error) {
    console.error("Exception assigning lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}

export async function deleteLead(leadId: number): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

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

    // Check if the user is authorized to delete this lead
    if (lead.assigned_to !== currentUser.employeeId && !currentUser.isAdmin) {
      return { success: false, message: "You are not authorized to delete this lead" }
    }

    const { error: deleteError } = await supabase.from("leads").delete().eq("id", leadId)

    if (deleteError) {
      console.error("Error deleting lead:", deleteError)
      return { success: false, message: "Failed to delete lead" }
    }

    await logActivity({
      actionType: "delete",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: `Lead ${lead.lead_number} (${lead.client_name}) deleted`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath("/sales/manage-lead")
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/unassigned-lead")

    return { success: true, message: `Lead ${lead.lead_number} deleted successfully` }
  } catch (error) {
    console.error("Error deleting lead:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Schedule a follow-up for a lead
export async function scheduleLeadFollowup(data: {
  leadId: number
  scheduledAt: string
  followupType: string
  notes?: string
  priority: string
  summary?: string
  nextFollowUpDate?: string
  followUpRequired?: boolean
  durationMinutes?: number
}): Promise<{ success: boolean; message?: string; data?: any }> {
  const supabase = createClient()

  try {
    // Get the current user
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return { success: false, message: "User not authenticated" }
    }

    console.log("Scheduling follow-up with data:", {
      ...data,
      currentUserId: currentUser.id,
    })

    // Prepare the insert data with correct field names matching the database schema
    const insertData: any = {
      lead_id: data.leadId,
      scheduled_at: data.scheduledAt,
      contact_method: data.followupType,
      notes: data.notes || null,
      priority: data.priority,
      interaction_summary: data.summary || null,
      status: "scheduled",
      created_by: currentUser.id ? String(currentUser.id) : null,
      follow_up_required: data.followUpRequired || false,
      next_follow_up_date: data.nextFollowUpDate || null,
      duration_minutes: data.durationMinutes || null,
      created_at: new Date().toISOString(),
    }

    // Insert the follow-up
    const { data: followup, error } = await supabase.from("lead_followups").insert(insertData).select()

    if (error) {
      console.error("Error inserting follow-up:", error)
      
      // Provide specific guidance for schema cache issues
      if (error.message.includes("schema cache") || error.message.includes("followup_type")) {
        return { 
          success: false, 
          message: `Schema cache issue detected. Please restart your Supabase project in the dashboard (Project Settings → General → Restart Project), then try again. Error: ${error.message}` 
        }
      }
      
      return { success: false, message: `Failed to schedule follow-up: ${error.message}` }
    }

    // Update the lead's last_contacted field
    const { error: updateError } = await supabase
      .from("leads")
      .update({ last_contacted: new Date().toISOString() })
      .eq("id", data.leadId)

    if (updateError) {
      console.error("Error updating lead last_contacted:", updateError)
      // We don't fail the whole operation if just this update fails
    }

    // Revalidate the leads page
    revalidatePath("/sales/my-leads")
    revalidatePath(`/sales/lead/${data.leadId}`)
    revalidatePath("/follow-ups/dashboard")

    return {
      success: true,
      message: "Follow-up scheduled successfully",
      data: followup ? followup[0] : null,
    }
  } catch (error) {
    console.error("Unexpected error scheduling follow-up:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function sendLeadMessage(
  leadId: number,
  messageType: string,
  subject: string,
  message: string,
): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    const { error } = await supabase.from("lead_messages").insert({
      lead_id: leadId,
      message_type: messageType,
      subject: subject,
      message_body: message,
      sent_by: currentUser.id,
    })

    if (error) {
      console.error("Error sending message:", error)
      return { success: false, message: "Failed to send message" }
    }

    await logActivity({
      actionType: "send",
      entityType: "lead_message",
      entityId: leadId.toString(),
      entityName: `Lead ${leadId}`,
      description: `Message sent to lead ${leadId} via ${messageType}`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath(`/sales/lead/${leadId}`)
    return { success: true, message: "Message sent successfully" }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
