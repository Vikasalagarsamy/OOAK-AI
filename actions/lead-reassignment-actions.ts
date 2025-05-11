"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"
import { getCurrentUser } from "@/lib/auth-utils"

// Get employees for a specific company and branch
export async function getEmployeesByCompanyAndBranch(
  companyId: number,
  branchId: number | null,
  location: string | null,
) {
  const supabase = createClient()

  try {
    // First, get branch location if we have a branch ID
    let branchLocation = null
    if (branchId) {
      const { data: branchData, error: branchError } = await supabase
        .from("branches")
        .select("location")
        .eq("id", branchId)
        .single()

      if (!branchError && branchData) {
        branchLocation = branchData.location
      }
    }

    // Use provided location or branch location
    const effectiveLocation = location || branchLocation

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
          status
        )
      `)
      .eq("employee_companies.company_id", companyId)
      .eq("status", "active")
      .eq("employee_companies.status", "active")

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

      // Calculate role from job_title - use a default if null
      const role = emp.job_title || "Sales Representative"

      // Determine if this is a sales role - be more inclusive
      const isSalesRole = true // Include all employees as potential assignees

      return {
        id: emp.id,
        employee_id: emp.employee_id || `EMP-${emp.id}`,
        first_name: emp.first_name || "",
        last_name: emp.last_name || "",
        full_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${emp.id}`,
        role: role,
        company_id: companyData?.company_id,
        branch_id: companyData?.branch_id,
        location: effectiveLocation, // Use the effective location
        allocation_percentage: companyData?.allocation_percentage,
        is_sales_role: isSalesRole,
      }
    })

    // Log for debugging
    console.log(`Found ${employees.length} employees for company ${companyId}, branch ${branchId || "any"}`)

    return employees
  } catch (error) {
    console.error("Exception in getEmployeesByCompanyAndBranch:", error)
    return []
  }
}

export async function reassignLead(
  leadId: string,
  employeeId: string,
): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  const supabase = createClient()

  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get the lead details
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name, assigned_to, status")
      .eq("id", leadId)
      .single()

    if (fetchError) {
      console.error("Error fetching lead:", fetchError)
      return { success: false, error: "Failed to fetch lead details" }
    }

    if (!lead) {
      return { success: false, error: "Lead not found" }
    }

    // Check if the user is authorized to reassign this lead
    if (lead.assigned_to !== currentUser.employeeId && !currentUser.isAdmin) {
      return { success: false, error: "You are not authorized to reassign this lead" }
    }

    // Get the employee details
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, status")
      .eq("id", employeeId)
      .single()

    if (employeeError || !employee) {
      return { success: false, error: "Employee not found" }
    }

    // Check if employee is active
    if (employee.status !== "active") {
      return {
        success: false,
        error: `Cannot reassign lead to inactive employee: ${employee.first_name} ${employee.last_name}`,
      }
    }

    // Update the lead's assigned_to field
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (updateError) {
      console.error("Error reassigning lead:", updateError)
      return { success: false, error: "Failed to reassign lead" }
    }

    // Log the activity
    await logActivity({
      actionType: "reassign",
      entityType: "lead",
      entityId: leadId,
      entityName: lead.lead_number,
      description: `Lead ${lead.lead_number} reassigned from ${lead.assigned_to_name || "unassigned"} to ${employee.first_name} ${employee.last_name}`,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
    })

    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/manage-lead")
    revalidatePath("/sales/my-leads")
    revalidatePath("/sales/unassigned-lead")

    return {
      success: true,
      message: `Lead ${lead.lead_number} reassigned to ${employee.first_name} ${employee.last_name}`,
    }
  } catch (error: any) {
    console.error("Error reassigning lead:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
