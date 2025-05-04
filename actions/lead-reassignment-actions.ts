"use server"
import { revalidatePath } from "next/cache"
import { getEmployeesForLeadAssignment } from "./employee-selection-actions"
import { assignLeadToEmployee } from "./lead-actions"

interface ReassignmentResult {
  success: boolean
  message: string
}

// Update the reassignLead function to use our improved logic
export async function reassignLead(leadId: string, employeeId: string) {
  try {
    // Use the improved assignLeadToEmployee function
    const result = await assignLeadToEmployee(Number(leadId), Number(employeeId))

    if (result.success) {
      // Revalidate paths
      revalidatePath(`/sales/lead/${leadId}`)
      revalidatePath("/sales/unassigned-lead")
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
