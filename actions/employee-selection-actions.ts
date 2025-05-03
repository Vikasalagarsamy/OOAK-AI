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
    // First try to use the stored function if it exists
    try {
      const { data, error } = await supabase.rpc("get_sales_employees_for_lead", {
        lead_company_id: companyId || null,
        lead_location: branchId ? undefined : null, // Only use location if branchId is not provided
      })

      if (!error && data) {
        console.log(`Successfully fetched ${data.length} employees using RPC function`)
        return data
      }

      // If there's an error, we'll fall through to the fallback query
      console.warn("RPC function failed, using fallback query:", error)
    } catch (rpcError) {
      console.warn("RPC function not available, using fallback query:", rpcError)
    }

    // Fallback query - direct database query
    console.log("Using fallback query to fetch employees")

    // Get the table columns first to check what's available
    const { data: columnInfo, error: columnError } = await supabase.from("employees").select().limit(1)

    if (columnError) {
      console.error("Error checking employee table schema:", columnError)
      return []
    }

    // Determine available columns
    const sampleEmployee = columnInfo && columnInfo.length > 0 ? columnInfo[0] : {}
    const availableColumns = Object.keys(sampleEmployee)

    console.log("Available columns:", availableColumns)

    // Build a dynamic select statement based on available columns
    const selectColumns = [
      "id",
      "employee_id",
      ...(availableColumns.includes("first_name") ? ["first_name"] : []),
      ...(availableColumns.includes("last_name") ? ["last_name"] : []),
      ...(availableColumns.includes("job_title") ? ["job_title"] : []),
      ...(availableColumns.includes("department") ? ["department"] : []),
      ...(availableColumns.includes("location") ? ["location"] : []),
      ...(availableColumns.includes("status") ? ["status"] : []),
      ...(availableColumns.includes("company_id") ? ["company_id"] : []),
      ...(availableColumns.includes("branch_id") ? ["branch_id"] : []),
      ...(availableColumns.includes("department_id") ? ["department_id"] : []),
      ...(availableColumns.includes("designation") ? ["designation"] : []),
    ].join(", ")

    // First, get all active employees
    const { data: allEmployees, error: employeesError } = await supabase
      .from("employees")
      .select(selectColumns)
      .eq("status", "active")
      .order("first_name")

    if (employeesError) {
      console.error("Error fetching employees:", employeesError)
      return []
    }

    // Then, get employee-company allocations if we need to filter by company
    let employeeAllocations = []
    if (companyId) {
      const { data: allocations, error: allocationsError } = await supabase
        .from("employee_companies")
        .select(`
          employee_id,
          company_id,
          branch_id,
          allocation_percentage,
          is_primary
        `)
        .eq("company_id", companyId)

      if (allocationsError) {
        console.error("Error fetching employee allocations:", allocationsError)
      } else {
        employeeAllocations = allocations || []
      }
    }

    // Filter employees based on company if needed
    let filteredEmployees = allEmployees
    if (companyId) {
      // Get employees directly assigned to the company
      const directEmployees = allEmployees.filter((emp) => emp.company_id === companyId)

      // Get employees assigned through allocations
      const allocatedEmployeeIds = employeeAllocations.map((alloc) => alloc.employee_id)
      const allocatedEmployees = allEmployees.filter((emp) => allocatedEmployeeIds.includes(emp.id))

      // Combine both sets
      const combinedEmployeeIds = new Set([
        ...directEmployees.map((emp) => emp.id),
        ...allocatedEmployees.map((emp) => emp.id),
      ])

      filteredEmployees = allEmployees.filter((emp) => combinedEmployeeIds.has(emp.id))
    }

    // Filter for sales-related roles based on available columns
    const salesEmployees = filteredEmployees.filter((emp) => {
      const isSalesRole =
        (emp.job_title && emp.job_title.toLowerCase().includes("sales")) ||
        (emp.department && emp.department.toLowerCase().includes("sales")) ||
        (emp.job_title && emp.job_title.toLowerCase().includes("account manager")) ||
        (emp.job_title && emp.job_title.toLowerCase().includes("business development")) ||
        (emp.designation && emp.designation.toLowerCase().includes("sales"))

      // We can't check for executives without the role field, so we'll just use job_title
      const isNotExecutive = !(
        emp.job_title &&
        /ceo|cto|cfo|coo|president|vice president|vp|chief|director|head of|founder|owner/i.test(emp.job_title)
      )

      return isSalesRole && isNotExecutive
    })

    // Format the data to match the expected structure
    return salesEmployees.map((emp) => {
      // Find allocation data if available
      const allocation = employeeAllocations.find((alloc) => alloc.employee_id === emp.id)

      // Generate full name from first and last name
      const firstName = emp.first_name || ""
      const lastName = emp.last_name || ""
      const fullName = `${firstName} ${lastName}`.trim()

      return {
        id: emp.id,
        employee_id: emp.employee_id,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        job_title: emp.job_title || "",
        role: emp.designation || emp.job_title || "", // Use designation as role if available
        department: emp.department || "",
        location: emp.location || "",
        status: emp.status || "active",
        company_id: emp.company_id,
        branch_id: emp.branch_id,
        department_id: emp.department_id,
        designation: emp.designation || emp.job_title || "",
        is_sales: true,
        allocation_percentage: allocation?.allocation_percentage,
        is_primary: allocation?.is_primary || false,
      }
    })
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
