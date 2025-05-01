"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

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
  const supabase = createClient()
  console.log(
    `Fetching sales resources for company ${companyId}, branch ${branchId}, and location ${location || "any"}`,
  )

  try {
    // First, try to find the Sales department ID
    const { data: salesDept, error: deptError } = await supabase
      .from("departments")
      .select("id")
      .ilike("name", "%sales%")

    if (deptError) {
      console.error("Error fetching sales departments:", deptError)
    }

    // Create an array of sales department IDs
    const salesDeptIds = salesDept ? salesDept.map((dept) => dept.id) : []

    // Get all employees with their detailed information
    let query = supabase
      .from("employees")
      .select(`
        id, 
        employee_id, 
        first_name, 
        last_name, 
        status, 
        company_id, 
        branch_id, 
        department_id, 
        role, 
        job_title, 
        department,
        location
      `)
      .eq("status", "active")
      .eq("company_id", companyId)

    // If branch_id is provided, prioritize employees from that branch
    if (branchId) {
      query = query.eq("branch_id", branchId)
    }

    // If location is provided, prioritize employees from that location
    if (location) {
      query = query.eq("location", location)
    }

    // Execute the query
    const { data: allEmployees, error: employeesError } = await query.order("first_name")

    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      return []
    }

    // If no employees found with exact branch and location match, try with just the company
    if (!allEmployees || allEmployees.length === 0) {
      console.log("No employees found with exact branch and location match, trying with just company")

      // Try again with just company filter
      const { data: companyEmployees, error: companyError } = await supabase
        .from("employees")
        .select(`
          id, 
          employee_id, 
          first_name, 
          last_name, 
          status, 
          company_id, 
          branch_id, 
          department_id, 
          role, 
          job_title, 
          department,
          location
        `)
        .eq("status", "active")
        .eq("company_id", companyId)
        .order("first_name")

      if (companyError || !companyEmployees || companyEmployees.length === 0) {
        console.error("Error fetching company employees:", companyError)
        return []
      }

      // Use company employees instead
      return filterSalesEmployees(companyEmployees, salesDeptIds, location)
    }

    // Filter and return sales employees
    return filterSalesEmployees(allEmployees, salesDeptIds, location)
  } catch (error) {
    console.error("Exception fetching sales employees:", error)
    return []
  }
}

// Helper function to filter sales employees
function filterSalesEmployees(employees: any[], salesDeptIds: number[], location: string | null | undefined) {
  // Define executive roles to explicitly exclude
  const executiveRoles = [
    "ceo",
    "cto",
    "cfo",
    "coo",
    "president",
    "vice president",
    "vp",
    "chief",
    "director",
    "head of",
    "founder",
    "owner",
    "partner",
    "principal",
  ]

  // Apply comprehensive filtering to identify sales personnel
  const salesEmployees = employees.filter((emp) => {
    // Check if employee has an executive role that should be excluded
    const hasExecutiveRole = executiveRoles.some((role) => {
      const roleStr = (emp.role || "").toLowerCase()
      const titleStr = (emp.job_title || "").toLowerCase()
      return roleStr.includes(role) || titleStr.includes(role)
    })

    // If employee has an executive role, exclude them
    if (hasExecutiveRole) {
      return false
    }

    // Check multiple fields for sales-related keywords
    const isSalesDept = salesDeptIds.includes(emp.department_id)
    const hasSalesRole = emp.role && emp.role.toLowerCase().includes("sales")
    const hasSalesJobTitle = emp.job_title && emp.job_title.toLowerCase().includes("sales")
    const hasSalesDepartment = emp.department && emp.department.toLowerCase().includes("sales")

    // More specific business development check to avoid false positives
    const hasBDRole =
      (emp.role && emp.role.toLowerCase().includes("business development")) ||
      (emp.job_title && emp.job_title.toLowerCase().includes("business development"))

    // More specific account manager check to avoid false positives
    const hasAccountRole =
      (emp.role &&
        (emp.role.toLowerCase().includes("account manager") || emp.role.toLowerCase().includes("account executive"))) ||
      (emp.job_title &&
        (emp.job_title.toLowerCase().includes("account manager") ||
          emp.job_title.toLowerCase().includes("account executive")))

    // Include employees with any sales-related indicators
    return isSalesDept || hasSalesRole || hasSalesJobTitle || hasSalesDepartment || hasBDRole || hasAccountRole
  })

  // Sort employees to prioritize those matching the location
  const sortedEmployees = [...salesEmployees].sort((a, b) => {
    if (location) {
      const aMatchesLocation = (a.location || "").toLowerCase() === location.toLowerCase()
      const bMatchesLocation = (b.location || "").toLowerCase() === location.toLowerCase()

      if (aMatchesLocation && !bMatchesLocation) return -1
      if (!aMatchesLocation && bMatchesLocation) return 1
    }
    return a.first_name.localeCompare(b.first_name)
  })

  // Add a final validation step to ensure we're only returning sales personnel
  return sortedEmployees.map((emp) => ({
    id: emp.id,
    employee_id: emp.employee_id || "",
    first_name: emp.first_name,
    last_name: emp.last_name,
    full_name: `${emp.first_name} ${emp.last_name}`,
    company_id: emp.company_id,
    branch_id: emp.branch_id,
    role: emp.job_title || emp.role || "Sales Representative",
    location: emp.location || "Not specified",
    // Add a flag to indicate if this is definitely a sales role (for debugging)
    is_sales_role: true,
  }))
}
