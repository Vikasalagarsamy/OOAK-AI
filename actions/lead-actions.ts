"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"

interface AssignLeadResult {
  success: boolean
  message: string
}

export async function assignLeadToEmployee(leadId: number, employeeId: number): Promise<AssignLeadResult> {
  // Validate input parameters
  if (!leadId || isNaN(leadId)) {
    return { success: false, message: `Invalid lead ID: ${leadId}` }
  }

  if (!employeeId || isNaN(employeeId)) {
    return { success: false, message: `Invalid employee ID: ${employeeId}` }
  }

  const supabase = createClient()

  try {
    console.log(`Assigning lead ${leadId} to employee ${employeeId}`)

    // Get the lead details first
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, company_id, branch_id, status, lead_number, client_name")
      .eq("id", leadId)
      .single()

    if (leadError) {
      console.error("Error fetching lead:", leadError)
      return { success: false, message: `Failed to fetch lead: ${leadError.message}` }
    }

    // Get the employee details
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, status")
      .eq("id", employeeId)
      .single()

    if (employeeError) {
      console.error("Error fetching employee:", employeeError)
      return { success: false, message: `Failed to fetch employee: ${employeeError.message}` }
    }

    // Verify employee is active
    if (employee.status !== "active") {
      return {
        success: false,
        message: `Cannot assign lead to inactive employee: ${employee.first_name} ${employee.last_name}`,
      }
    }

    // Check if employee has allocation to the lead's company
    if (lead.company_id) {
      const { data: allocations, error: allocError } = await supabase
        .from("employee_companies")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("company_id", lead.company_id)
        .is("end_date", null) // Only active allocations

      if (allocError) {
        console.error("Error checking employee allocation:", allocError)
      } else if (!allocations || allocations.length === 0) {
        console.warn(
          `Employee ${employeeId} has no allocation to company ${lead.company_id}, but proceeding with assignment`,
        )
      }
    }

    // Update the lead
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeId,
        status: "ASSIGNED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (updateError) {
      console.error("Error assigning lead:", updateError)
      return { success: false, message: `Failed to assign lead: ${updateError.message}` }
    }

    // Log the activity
    try {
      await logActivity({
        actionType: "assignment",
        entityType: "lead",
        entityId: leadId.toString(),
        entityName: lead.lead_number || `Lead #${leadId}`,
        description: `Lead ${lead.lead_number || `#${leadId}`} for ${lead.client_name || "Unknown Client"} assigned to ${employee.first_name} ${employee.last_name}`,
        userName: "System",
      })
    } catch (logError) {
      console.error("Error logging activity:", logError)
      // Don't fail the assignment if logging fails
    }

    // Revalidate relevant paths
    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/unassigned-lead")
    revalidatePath("/sales/manage-lead")

    return {
      success: true,
      message: `Lead successfully assigned to ${employee.first_name} ${employee.last_name}`,
    }
  } catch (error) {
    console.error("Exception assigning lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}

export async function assignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  employeeId: number,
  employeeName: string,
): Promise<{ success: boolean; message: string }> {
  // Validate input parameters
  if (!leadId || isNaN(leadId)) {
    return { success: false, message: `Invalid lead ID: ${leadId}` }
  }

  if (!employeeId || isNaN(employeeId)) {
    return { success: false, message: `Invalid employee ID: ${employeeId}` }
  }

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
      userName: "System", // You might want to get the actual user name
    })

    // Revalidate relevant paths
    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/unassigned-lead")
    revalidatePath("/sales/manage-lead")

    return { success: true, message: `Lead ${leadNumber} assigned to ${employeeName}` }
  } catch (error) {
    console.error("Error assigning lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}

export async function deleteLead(leadId: number): Promise<{ success: boolean; message: string }> {
  // Validate input parameter
  if (!leadId || isNaN(leadId)) {
    return { success: false, message: `Invalid lead ID: ${leadId}` }
  }

  const supabase = createClient()

  try {
    const { data: lead, error: fetchError } = await supabase.from("leads").select("*").eq("id", leadId).single()

    if (fetchError) {
      return { success: false, message: `Failed to fetch lead: ${fetchError.message}` }
    }

    if (!lead) {
      return { success: false, message: "Lead not found" }
    }

    const { error: deleteError } = await supabase.from("leads").delete().eq("id", leadId)

    if (deleteError) {
      console.error("Error deleting lead:", deleteError)
      return { success: false, message: `Failed to delete lead: ${deleteError.message}` }
    }

    // Log the activity
    await logActivity({
      actionType: "delete",
      entityType: "lead",
      entityId: leadId.toString(),
      entityName: lead.lead_number,
      description: `Lead ${lead.lead_number} for ${lead.client_name} deleted`,
      userName: "System", // You might want to get the actual user name
    })

    revalidatePath("/sales/manage-lead")
    revalidatePath("/sales/unassigned-lead")
    return { success: true, message: `Lead ${lead.lead_number} deleted successfully` }
  } catch (error) {
    console.error("Error deleting lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
