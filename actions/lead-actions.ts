"use server"

import { createClient } from "@/lib/supabase/server"
import { logActivity } from "@/services/activity-service"

export async function getLeads() {
  const supabase = createClient()

  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching leads:", error)
    throw new Error(`Error fetching leads: ${error.message}`)
  }

  return data
}

/**
 * Assigns a lead to an employee
 */
export async function assignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  employeeId: number,
  employeeName: string,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // Update the lead with the assigned employee
    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeId,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
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
      description: `Lead ${leadNumber} (${clientName}) assigned to ${employeeName}`,
      userName: "System", // You might want to change this to the current user
    })

    return {
      success: true,
      message: `Lead ${leadNumber} successfully assigned to ${employeeName}`,
    }
  } catch (error) {
    console.error("Exception assigning lead:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Assigns a lead to an employee (simplified version)
 */
export async function assignLeadToEmployee(leadId: number, employeeId: number): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("leads")
    .update({
      assigned_to: employeeId,
      status: "assigned",
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)

  if (error) {
    console.error("Error assigning lead:", error)
    throw new Error(`Failed to assign lead: ${error.message}`)
  }
}

/**
 * Deletes a lead from the system
 */
export async function deleteLead(leadId: number): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // First, get the lead details for logging
    const { data: leadData, error: fetchError } = await supabase
      .from("leads")
      .select("lead_number, client_name")
      .eq("id", leadId)
      .single()

    if (fetchError) {
      console.error("Error fetching lead details:", fetchError)
      return { success: false, message: `Failed to fetch lead details: ${fetchError.message}` }
    }

    // Delete the lead
    const { error: deleteError } = await supabase.from("leads").delete().eq("id", leadId)

    if (deleteError) {
      console.error("Error deleting lead:", deleteError)
      return { success: false, message: `Failed to delete lead: ${deleteError.message}` }
    }

    // Log the activity using the activity service
    await logActivity({
      actionType: "delete",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: leadData.lead_number,
      description: `Lead ${leadData.lead_number} (${leadData.client_name}) was deleted`,
      userName: "System", // You might want to change this to the current user
    })

    return {
      success: true,
      message: `Lead ${leadData.lead_number} for ${leadData.client_name} was successfully deleted`,
    }
  } catch (error) {
    console.error("Exception deleting lead:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
