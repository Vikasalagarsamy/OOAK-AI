"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getEmployeesForLeadAssignment } from "./employee-selection-actions"

interface ReassignmentResult {
  success: boolean
  message: string
}

export async function reassignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  newEmployeeId: number,
  newEmployeeName: string,
): Promise<ReassignmentResult> {
  const supabase = createClient()

  try {
    // Update the lead's assigned_to field
    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: newEmployeeId,
        status: "ASSIGNED", // Ensure status is set to ASSIGNED
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error reassigning lead:", error)
      return {
        success: false,
        message: `Failed to reassign lead: ${error.message}`,
      }
    }

    // Log the reassignment activity
    const { error: activityError } = await supabase.from("activities").insert({
      action_type: "LEAD_REASSIGNED", // Changed from activity_type to action_type
      entity_type: "lead", // Changed from reference_type to entity_type
      entity_id: leadId, // Changed from reference_id to entity_id
      entity_name: leadNumber,
      description: `Lead ${leadNumber} (${clientName}) was reassigned to ${newEmployeeName}`,
      user_name: "system", // This should ideally be the current user's ID
      created_at: new Date().toISOString(),
    })

    if (activityError) {
      console.error("Error logging reassignment activity:", activityError)
      // We don't fail the whole operation if just the activity logging fails
    }

    // Revalidate the manage leads page to reflect changes
    revalidatePath("/sales/manage-lead")

    return {
      success: true,
      message: `Lead successfully reassigned to ${newEmployeeName}`,
    }
  } catch (error) {
    console.error("Exception reassigning lead:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

// Enhanced function to get employees by company, branch, and location
export async function getEmployeesByCompanyAndBranch(
  companyId: number,
  branchId?: number | null,
  location?: string | null,
) {
  // Use our new employee selection action
  const employees = await getEmployeesForLeadAssignment(companyId, branchId, "Sales")

  // Format the employees for the existing interface
  return employees.map((emp) => ({
    id: emp.id,
    employee_id: emp.employee_id || "",
    first_name: emp.first_name,
    last_name: emp.last_name,
    full_name: emp.full_name,
    company_id: emp.allocations.find((a) => a.is_primary)?.company_id || companyId,
    branch_id: emp.allocations.find((a) => a.is_primary)?.branch_id,
    role: emp.job_title || emp.role || "Sales Representative",
    location: location || "Not specified",
    // Add a flag to indicate if this is definitely a sales role (for debugging)
    is_sales_role: true,
  }))
}
