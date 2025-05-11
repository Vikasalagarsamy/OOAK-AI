"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Get employees for a specific company and branch
export async function getEmployeesByCompanyAndBranch(
  companyId: number,
  branchId: number | null,
  location: string | null,
) {
  const supabase = createClient()

  try {
    // Start building our query
    let query = supabase
      .from("employees")
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        job_title,
        status,
        employee_companies!inner(
          company_id,
          branch_id,
          is_primary,
          allocation_percentage,
          location
        )
      `)
      .eq("employee_companies.company_id", companyId)
      .eq("status", "ACTIVE")

    // Add branch filter if provided
    if (branchId) {
      query = query.eq("employee_companies.branch_id", branchId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching employees:", error)
      return []
    }

    // Transform the data to flatten the structure
    const employees = data.map((emp) => {
      // Get the company data
      const companyData = Array.isArray(emp.employee_companies) ? emp.employee_companies[0] : emp.employee_companies

      // Calculate role from job_title
      const role = emp.job_title || "Sales Representative"

      // Determine if this is a sales role
      const isSalesRole =
        role.toLowerCase().includes("sales") ||
        role.toLowerCase().includes("account") ||
        role.toLowerCase().includes("business")

      return {
        id: emp.id,
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: `${emp.first_name} ${emp.last_name}`,
        role: role,
        company_id: companyData?.company_id,
        branch_id: companyData?.branch_id,
        location: companyData?.location,
        allocation_percentage: companyData?.allocation_percentage,
        is_sales_role: isSalesRole,
      }
    })

    // Filter to prefer employees in sales roles
    const salesEmployees = employees.filter((emp) => emp.is_sales_role)

    // If we have sales employees, return those, otherwise return all employees
    // This ensures we still show options even if no one has an explicitly sales-related title
    const filteredEmployees = salesEmployees.length > 0 ? salesEmployees : employees

    // If location is provided, sort employees to prioritize those in that location
    if (location) {
      return filteredEmployees.sort((a, b) => {
        const aMatchesLocation = (a.location || "").toLowerCase() === location.toLowerCase()
        const bMatchesLocation = (b.location || "").toLowerCase() === location.toLowerCase()

        if (aMatchesLocation && !bMatchesLocation) return -1
        if (!aMatchesLocation && bMatchesLocation) return 1
        return 0
      })
    }

    return filteredEmployees
  } catch (error) {
    console.error("Exception in getEmployeesByCompanyAndBranch:", error)
    return []
  }
}

// Reassign a lead to a different employee
export async function reassignLead(leadId: string, employeeId: string) {
  const supabase = createClient()

  try {
    // Validate the IDs
    const leadIdNum = Number.parseInt(leadId)
    const employeeIdNum = Number.parseInt(employeeId)

    if (isNaN(leadIdNum) || isNaN(employeeIdNum)) {
      return {
        success: false,
        error: "Invalid lead ID or employee ID",
      }
    }

    // Get current lead data for logging
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .select("lead_number, client_name, assigned_to")
      .eq("id", leadIdNum)
      .single()

    if (leadError) {
      console.error("Error fetching lead data:", leadError)
      return {
        success: false,
        error: "Could not find lead information",
      }
    }

    // Get employee data for assignment
    const { data: employeeData, error: empError } = await supabase
      .from("employees")
      .select("first_name, last_name")
      .eq("id", employeeIdNum)
      .single()

    if (empError) {
      console.error("Error fetching employee data:", empError)
      return {
        success: false,
        error: "Could not find employee information",
      }
    }

    // Update the lead assignment
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeIdNum,
        status: "ASSIGNED", // Always set to ASSIGNED on reassignment
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdNum)

    if (updateError) {
      console.error("Error updating lead assignment:", updateError)
      return {
        success: false,
        error: "Failed to update lead assignment",
      }
    }

    // Log the activity
    const employeeName = `${employeeData.first_name} ${employeeData.last_name}`
    const { error: logError } = await supabase.from("activities").insert({
      activity_type: "LEAD_REASSIGNED",
      entity_type: "LEAD",
      entity_id: leadIdNum,
      description: `Lead ${leadData.lead_number} (${leadData.client_name}) reassigned to ${employeeName}`,
      created_at: new Date().toISOString(),
      user_id: "system", // Ideally, this would be the current user's ID
    })

    if (logError) {
      console.error("Error logging activity:", logError)
      // Continue despite logging error
    }

    // Revalidate relevant paths
    revalidatePath("/sales/manage-lead")
    revalidatePath(`/sales/lead/${leadId}`)

    return {
      success: true,
      message: `Lead successfully reassigned to ${employeeName}`,
    }
  } catch (error) {
    console.error("Exception in reassignLead:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
