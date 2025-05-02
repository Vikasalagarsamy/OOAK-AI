"use server"

import { createClient } from "@/lib/supabase/server"
import type { Employee } from "@/types/employee"

// Get employees for lead assignment, prioritizing sales roles in the same location
export async function getEmployeesForLeadAssignment(
  companyId?: number | undefined,
  branchId?: number | undefined,
  roleFilter = "Sales",
): Promise<Employee[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc("get_sales_employees_for_lead", {
      lead_company_id: companyId,
      lead_location: branchId ? undefined : null, // Only use location if branchId is not provided
    })

    if (error) {
      console.error("Error fetching employees for lead assignment:", error)
      // Fallback to a simpler query if the function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("employees")
        .select(`
          id,
          employee_id,
          first_name,
          last_name,
          full_name,
          job_title,
          role,
          department,
          location,
          employee_companies(
            company_id,
            branch_id,
            allocation_percentage,
            is_primary
          )
        `)
        .eq("status", "active")
        .order("first_name")

      if (fallbackError) {
        console.error("Error in fallback query:", fallbackError)
        return []
      }

      // Filter by company if provided
      const filteredData = companyId
        ? fallbackData.filter((emp) => emp.employee_companies.some((ec) => ec.company_id === companyId))
        : fallbackData

      // Format the data to match the expected structure
      return filteredData.map((emp) => ({
        id: emp.id,
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: emp.full_name,
        job_title: emp.job_title,
        role: emp.role,
        department: emp.department,
        location: emp.location,
        allocations: emp.employee_companies.map((ec) => ({
          company_id: ec.company_id,
          branch_id: ec.branch_id,
          allocation_percentage: ec.allocation_percentage,
          is_primary: ec.is_primary,
        })),
      }))
    }

    return data
  } catch (error) {
    console.error("Exception in getEmployeesForLeadAssignment:", error)
    return []
  }
}

// Assign a lead to an employee (simplified version)
export async function assignLeadToEmployee(
  leadId: number,
  employeeId: number,
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeId,
        status: "ASSIGNED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error assigning lead:", error)
      return { success: false, message: `Failed to assign lead: ${error.message}` }
    }

    return { success: true, message: `Lead successfully assigned to employee ${employeeId}` }
  } catch (error) {
    console.error("Exception assigning lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
