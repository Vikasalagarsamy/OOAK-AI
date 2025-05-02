"use server"

import { createClient } from "@/lib/supabase/server"

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
    await supabase.from("activities").insert({
      activity_type: "lead_assigned",
      description: `Lead ${leadNumber} (${clientName}) assigned to ${employeeName}`,
      performed_by: "system", // You might want to change this to the current user
      entity_type: "lead",
      entity_id: leadId,
      created_at: new Date().toISOString(),
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
