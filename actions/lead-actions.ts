"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"

interface DeleteLeadResult {
  success: boolean
  message: string
}

export async function deleteLead(leadId: number): Promise<DeleteLeadResult> {
  const supabase = createClient()

  try {
    const { data: lead, error: fetchError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (fetchError) {
      console.error("Error fetching lead:", fetchError)
      return { success: false, message: `Failed to fetch lead: ${fetchError.message}` }
    }

    if (!lead) {
      return { success: false, message: "Lead not found" }
    }

    const { error } = await supabase.from("leads").delete().eq("id", leadId)

    if (error) {
      console.error("Error deleting lead:", error)
      return { success: false, message: `Failed to delete lead: ${error.message}` }
    }

    // Log the activity
    await logActivity({
      actionType: "delete",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: `Lead ${lead.lead_number} for ${lead.client_name} was deleted`,
      userName: "Current User", // Replace with actual user name when available
    })

    revalidatePath("/sales/manage-lead")
    revalidatePath("/sales/unassigned-lead")
    return { success: true, message: `Lead ${lead.lead_number} deleted successfully` }
  } catch (error) {
    console.error("Error deleting lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}

interface AssignLeadResult {
  success: boolean
  message: string
}

export async function assignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  employeeId: number,
  employeeName: string,
): Promise<AssignLeadResult> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("leads")
      .update({ assigned_to: employeeId, status: "ASSIGNED", updated_at: new Date().toISOString() })
      .eq("id", leadId)

    if (error) {
      console.error("Error assigning lead:", error)
      return { success: false, message: `Failed to assign lead: ${error.message}` }
    }

    // Log the activity
    await logActivity({
      actionType: "assignment",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: leadNumber,
      description: `Lead ${leadNumber} for ${clientName} assigned to ${employeeName}`,
      userName: "Current User", // Replace with actual user name when available
    })

    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/unassigned-lead")
    return { success: true, message: `Lead ${leadNumber} successfully assigned to ${employeeName}` }
  } catch (error) {
    console.error("Error assigning lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
