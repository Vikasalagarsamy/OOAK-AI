"use server"

import { createClient } from "@/lib/supabase/server"

export async function getLeads() {
  const supabase = createClient()

  try {
    // First, fetch the leads without trying to use relationships
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (leadsError) {
      console.error("Error fetching leads:", leadsError)
      throw new Error(`Error fetching leads: ${leadsError.message}`)
    }

    // Process the leads to add additional information
    const enhancedLeads = await Promise.all(
      leadsData.map(async (lead) => {
        let companyName = null
        let branchName = null
        let branchLocation = null
        let leadSourceName = null

        // Fetch company info if company_id exists
        if (lead.company_id) {
          const { data: companyData } = await supabase
            .from("companies")
            .select("name")
            .eq("id", lead.company_id)
            .single()

          companyName = companyData?.name || null
        }

        // Fetch branch info if branch_id exists
        if (lead.branch_id) {
          const { data: branchData } = await supabase
            .from("branches")
            .select("name, location")
            .eq("id", lead.branch_id)
            .single()

          branchName = branchData?.name || null
          branchLocation = branchData?.location || null
        }

        // Fetch lead source info if lead_source_id exists
        // Check if the column exists first
        if (lead.lead_source_id !== undefined) {
          try {
            const { data: sourceData } = await supabase
              .from("lead_sources")
              .select("name")
              .eq("id", lead.lead_source_id)
              .single()

            leadSourceName = sourceData?.name || null
          } catch (error) {
            console.log("Lead source fetch error (might not exist):", error)
          }
        }

        // Return the enhanced lead with additional information
        return {
          ...lead,
          company_name: companyName,
          branch_name: branchName,
          branch_location: branchLocation,
          lead_source_name: leadSourceName,
        }
      }),
    )

    return enhancedLeads
  } catch (error) {
    console.error("Error processing leads:", error)
    throw new Error(`Error processing leads: ${error instanceof Error ? error.message : String(error)}`)
  }
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

/**
 * Deletes a lead from the system
 */
export async function deleteLead(leadId: number | undefined): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  // Validate leadId
  if (leadId === undefined || isNaN(Number(leadId))) {
    return {
      success: false,
      message: "Invalid lead ID provided",
    }
  }

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

    // Log the activity
    await supabase.from("activities").insert({
      activity_type: "lead_deleted",
      description: `Lead ${leadData.lead_number} (${leadData.client_name}) was deleted`,
      performed_by: "system", // You might want to change this to the current user
      entity_type: "lead",
      entity_id: leadId,
      created_at: new Date().toISOString(),
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
