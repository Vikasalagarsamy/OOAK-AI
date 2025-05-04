"use server"
import { revalidatePath } from "next/cache"
import { getEmployeesForLeadAssignment } from "./employee-selection-actions"
import { assignLeadToEmployee } from "./lead-actions"

interface ReassignmentResult {
  success: boolean
  message?: string
  error?: string
}

// Update the reassignLead function to use our improved logic
export async function reassignLead(leadId: string, employeeId: string): Promise<ReassignmentResult> {
  try {
    // Parse the IDs to integers and validate them
    const parsedLeadId = Number.parseInt(leadId, 10)
    const parsedEmployeeId = Number.parseInt(employeeId, 10)

    // Validate that the parsed values are actual numbers
    if (isNaN(parsedLeadId)) {
      console.error("Invalid lead ID:", leadId)
      return { success: false, error: `Invalid lead ID: ${leadId}` }
    }

    if (isNaN(parsedEmployeeId)) {
      console.error("Invalid employee ID:", employeeId)
      return { success: false, error: `Invalid employee ID: ${employeeId}` }
    }

    // Use the improved assignLeadToEmployee function with validated IDs
    const result = await assignLeadToEmployee(parsedLeadId, parsedEmployeeId)

    if (result.success) {
      // Revalidate paths
      revalidatePath(`/sales/lead/${leadId}`)
      revalidatePath("/sales/unassigned-lead")
      revalidatePath("/sales/manage-lead")
      return { success: true, message: result.message }
    } else {
      return { success: false, error: result.message }
    }
  } catch (error: any) {
    console.error("Error reassigning lead:", error)
    return { success: false, error: error.message }
  }
}

// Update the getEmployeesByCompanyAndBranch function
export async function getEmployeesByCompanyAndBranch(
  companyId: number,
  branchId?: number | null,
  location?: string | null,
) {
  try {
    // Validate companyId
    if (!companyId || isNaN(companyId)) {
      console.error("Invalid company ID:", companyId)
      return []
    }

    // Use our improved employee selection action
    const employees = await getEmployeesForLeadAssignment(companyId, branchId, "Sales")

    console.log(`Found ${employees.length} employees for company ${companyId}, branch ${branchId}`)

    // Format the employees for the existing interface
    return employees.map((emp) => ({
      id: emp.id,
      employee_id: emp.employee_id || "",
      first_name: emp.first_name,
      last_name: emp.last_name,
      full_name: emp.full_name,
      company_id: emp.company_id || companyId,
      branch_id: emp.branch_id || branchId,
      role: emp.job_title || emp.role || "Sales Representative",
      location: location || "Not specified",
      allocation_percentage: emp.allocation_percentage || 0,
      is_primary: emp.is_primary || false,
      is_sales_role: emp.is_sales || true,
    }))
  } catch (error) {
    console.error("Error in getEmployeesByCompanyAndBranch:", error)
    return []
  }
}
