"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getEmployeesForLeadAssignment } from "./employee-selection-actions"

interface ReassignmentResult {
  success: boolean
  message: string
}

export async function reassignLead(leadId: string, employeeId: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("leads").update({ assigned_to: employeeId }).eq("id", leadId)

    if (error) {
      throw new Error(`Error reassigning lead: ${error.message}`)
    }

    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/unassigned-lead")
    return { success: true }
  } catch (error: any) {
    console.error("Error reassigning lead:", error)
    return { success: false, error: error.message }
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
