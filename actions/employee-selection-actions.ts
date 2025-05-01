"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getEmployeesForLeadAssignment(
  companyId?: number | string | null,
  branchId?: number | string | null,
) {
  try {
    const supabase = createClient()

    // Convert string parameters to numbers if needed
    const companyIdNum = companyId ? Number(companyId) : undefined
    const branchIdNum = branchId ? Number(branchId) : undefined

    console.log(`Fetching employees for company ID: ${companyIdNum}, branch ID: ${branchIdNum || "any"}`)

    // First approach: Try to get employees directly without filtering by status
    // This is more inclusive and will show all employees allocated to the company
    let query = supabase
      .from("employee_companies")
      .select(`
        id,
        employee_id,
        company_id,
        branch_id,
        allocation_percentage,
        is_primary,
        employees(id, first_name, last_name, employee_id, status, designation_id, job_title)
      `)
      .eq("company_id", companyIdNum || 0)

    // Add branch filter if provided
    if (branchIdNum !== undefined && !isNaN(branchIdNum)) {
      query = query.eq("branch_id", branchIdNum)
    }

    const { data: allocations, error: allocationsError } = await query

    if (allocationsError) {
      console.error("Error fetching employee allocations:", allocationsError)
      return await getAllActiveEmployees()
    }

    console.log(`Found ${allocations?.length || 0} employee allocations for company ${companyIdNum}`)

    // If no allocations found, try getting all employees
    if (!allocations || allocations.length === 0) {
      console.log("No employees found for the specified company/branch, fetching all active employees")
      return await getAllActiveEmployees()
    }

    // Process the allocations to extract employee data
    const employeeData = allocations
      .filter((allocation) => allocation.employees) // Filter out any null employees
      .map((allocation) => {
        const employee = allocation.employees
        return {
          id: employee.id,
          employee_id: employee.employee_id,
          name: `${employee.first_name} ${employee.last_name}`,
          designation: employee.job_title || "Unknown",
          department: "", // We'll fill this in later if needed
          allocation_percentage: allocation.allocation_percentage,
          is_primary: allocation.is_primary || false,
          status: employee.status,
        }
      })

    console.log(`Processed ${employeeData.length} employees from allocations`)

    // If we have employee data, return it
    if (employeeData.length > 0) {
      // Sort by primary allocation first, then by name
      return employeeData.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return a.name.localeCompare(b.name)
      })
    }

    // If we still don't have any employees, fall back to getting all active employees
    return await getAllActiveEmployees()
  } catch (error) {
    console.error("Error in getEmployeesForLeadAssignment:", error)
    return await getAllActiveEmployees()
  }
}

// Fallback function to get all active employees
async function getAllActiveEmployees() {
  try {
    const supabase = createClient()

    console.log("Fetching all employees as fallback")

    // Get all employees without filtering by status
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select(`
        id, 
        first_name, 
        last_name, 
        employee_id, 
        status, 
        designation_id,
        job_title
      `)
      .order("first_name", { ascending: true })

    if (employeesError) {
      console.error("Error fetching all employees:", employeesError)
      return []
    }

    console.log(`Found ${employees?.length || 0} total employees`)

    // Transform employee data
    const result =
      employees?.map((emp) => {
        const isSales = emp.job_title?.toLowerCase().includes("sales") || false

        return {
          id: emp.id,
          employee_id: emp.employee_id,
          name: `${emp.first_name} ${emp.last_name}`,
          designation: emp.job_title || "Unknown",
          department: isSales ? "Sales" : "Other",
          is_sales: isSales,
          status: emp.status,
        }
      }) || []

    // Sort to prioritize sales employees
    return result.sort((a, b) => {
      if (a.is_sales && !b.is_sales) return -1
      if (!a.is_sales && b.is_sales) return 1
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    console.error("Error in getAllActiveEmployees:", error)
    return []
  }
}

export async function assignLeadToEmployee(leadId: number, employeeId: number) {
  try {
    const supabase = createClient()

    // Update the lead status and assigned_to
    const { error } = await supabase
      .from("leads")
      .update({
        status: "ASSIGNED",
        assigned_to: employeeId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error assigning lead:", error)
      return { success: false, message: "Failed to assign lead. Please try again." }
    }

    // Revalidate the leads pages
    revalidatePath("/sales/unassigned-lead")
    revalidatePath("/sales/manage-lead")

    return { success: true, message: "Lead assigned successfully!" }
  } catch (error) {
    console.error("Error in assignLeadToEmployee:", error)
    return { success: false, message: "An unexpected error occurred. Please try again." }
  }
}
