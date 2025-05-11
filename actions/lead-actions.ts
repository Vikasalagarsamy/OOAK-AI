"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"
import { getCurrentUser } from "@/lib/auth-utils"

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
        companies(name),
        branch_id,
        branches(name)
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

    // Special handling for rejected leads
    if (status === "REJECTED") {
      // Store the rejection information in the lead_rejections table
      const { error: rejectionError } = await supabase.from("lead_rejections").insert({
        lead_id: leadId,
        rejected_by: currentUser.employeeId,
        rejected_from_company_id: lead.company_id,
        rejected_from_branch_id: lead.branch_id,
        rejection_reason: notes || "No reason provided",
        rejected_at: new Date().toISOString(),
      })

      if (rejectionError) {
        console.error("Error storing rejection information:", rejectionError)
        return { success: false, message: "Failed to store rejection information" }
      }

      // Update the lead status to REJECTED and remove assignment
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          status: "REJECTED",
          updated_at: new Date().toISOString(),
          is_rejected: true,
          rejected_at: new Date().toISOString(),
          rejected_by: currentUser.employeeId,
          rejected_from_company_id: lead.company_id,
          rejected_from_branch_id: lead.branch_id,
        })
        .eq("id", leadId)

      if (updateError) {
        console.error("Error updating lead status:", updateError)
        return { success: false, message: "Failed to update lead status" }
      }

      // Log the activity
      await logActivity({
        actionType: "reject",
        entityType: "lead",
        entityId: leadId.toString(),
        entityName: lead.lead_number,
        description: `Lead rejected from ${lead.companies?.name || "company"}${
          lead.branches?.name ? ` (${lead.branches.name})` : ""
        }. Reason: ${notes || "No reason provided"}`,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
      })

      // Add rejection notes
      if (notes) {
        const { error: notesError } = await supabase.from("lead_notes").insert({
          lead_id: leadId,
          note: `Rejection reason: ${notes}`,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
          note_type: "rejection",
        })

        if (notesError) {
          console.error("Error adding rejection notes:", notesError)
          // Don't fail the status update if notes fail
        }
      }
    } else {
      // Regular status update for non-rejected leads
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
        description: `Lead status updated from ${lead.status} to ${status}`,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
      })

      // Add notes if provided
      if (notes) {
        const { error: notesError } = await supabase.from("lead_notes").insert({
          lead_id: leadId,
          note: notes,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
          note_type: "status_change",
        })

        if (notesError) {
          console.error("Error adding notes:", notesError)
          // Don't fail the status update if notes fail
        }
      }
    }

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
  rejectionReason?: string,
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
        companies(name),
        branch_id,
        branches(name),
        rejected_from_company_id,
        rejected_from_branch_id
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

    // Update the lead with new company, branch, and status
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        company_id: newCompanyId,
        branch_id: newBranchId,
        status: "UNASSIGNED", // Mark as unassigned
        assigned_to: null, // Remove assignment
        updated_at: new Date().toISOString(),
        is_reassigned: true, // Flag to indicate this lead was reassigned
        reassigned_at: new Date().toISOString(),
        reassigned_by: currentUser.employeeId,
        is_rejected: false, // No longer rejected
      })
      .eq("id", leadId)

    if (updateError) {
      console.error("Error reassigning lead:", updateError)
      return { success: false, message: "Failed to reassign lead" }
    }

    // Log the activity
    await logActivity({
      actionType: "reassign",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: `Lead reassigned from ${lead.companies?.name || "previous company"}${
        lead.branches?.name ? ` (${lead.branches.name})` : ""
      } to ${newCompany?.name || "new company"}${
        newBranchName ? ` (${newBranchName})` : ""
      }. Status changed to UNASSIGNED.`,
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

// Keep other existing functions
export async function assignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  employeeId: number,
  employeeName: string,
) {
  const supabase = createClient()

  try {
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
      description: `Lead ${leadNumber} assigned to ${employeeName}`,
      userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
    })

    revalidatePath("/sales/unassigned-lead")
    revalidatePath("/sales/my-leads")
    revalidatePath(`/sales/lead/${leadId}`)

    return { success: true, message: `Lead ${leadNumber} assigned to ${employeeName}` }
  } catch (error) {
    console.error("Error assigning lead:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function deleteLead(leadId: number): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("leads").delete().eq("id", leadId)

    if (error) {
      console.error("Error deleting lead:", error)
      return { success: false, message: `Failed to delete lead: ${error.message}` }
    }

    // Log the activity
    const currentUser = await getCurrentUser()
    await logActivity({
      actionType: "delete",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: `Lead ${leadId}`,
      description: `Lead ${leadId} deleted`,
      userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
    })

    revalidatePath("/sales/manage-lead")
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/unassigned-lead")

    return { success: true, message: "Lead deleted successfully" }
  } catch (error) {
    console.error("Error deleting lead:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function scheduleLeadFollowup(
  leadId: number,
  dateTime: string,
  followupType: string,
  notes?: string,
): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    const { error } = await supabase.from("lead_followups").insert({
      lead_id: leadId,
      followup_type: followupType,
      scheduled_at: dateTime,
      notes: notes || null,
      created_by: currentUser.id,
    })

    if (error) {
      console.error("Error scheduling follow-up:", error)
      return { success: false, message: `Failed to schedule follow-up: ${error.message}` }
    }

    // Log the activity
    await logActivity({
      actionType: "schedule",
      entityType: "lead_followup",
      entityId: leadId.toString(),
      entityName: `Lead ${leadId}`,
      description: `Follow-up scheduled for Lead ${leadId} on ${new Date(dateTime).toLocaleString()}`,
      userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
    })

    revalidatePath(`/sales/lead/${leadId}`)
    return { success: true }
  } catch (error) {
    console.error("Error scheduling follow-up:", error)
    return { success: false, message: "An unexpected error occurred" }
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
      subject: subject || null,
      message_body: message,
      sent_by: currentUser.id,
      status: "sent",
    })

    if (error) {
      console.error("Error sending message:", error)
      return { success: false, message: `Failed to send message: ${error.message}` }
    }

    // Log the activity
    await logActivity({
      actionType: "send",
      entityType: "lead_message",
      entityId: leadId.toString(),
      entityName: `Lead ${leadId}`,
      description: `Message sent to Lead ${leadId} via ${messageType}`,
      userName: `${currentUser?.firstName} ${currentUser?.lastName}`,
    })

    revalidatePath(`/sales/lead/${leadId}`)
    return { success: true }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
