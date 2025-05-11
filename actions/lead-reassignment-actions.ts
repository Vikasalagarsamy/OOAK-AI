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
    // Start building our query - now including designation and company information
    let query = supabase
      .from("employees")
      .select(`
        id,
        employee_id,
        first_name,
        last_name,
        job_title,
        status,
        designation_id,
        designations:designations(name),
        employee_companies!inner(
          company_id,
          branch_id,
          is_primary,
          allocation_percentage,
          status,
          companies:companies(name)
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

      // Get designation name
      const designationName = emp.designations?.name || null

      // Get company name
      const companyName = companyData?.companies?.name || null

      return {
        id: emp.id,
        employee_id: emp.employee_id || `EMP-${emp.id}`,
        first_name: emp.first_name || "",
        last_name: emp.last_name || "",
        full_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || `Employee ${emp.id}`,
        designation: designationName || emp.job_title || "Staff",
        company_name: companyName || "Unknown Company",
        company_id: companyData?.company_id,
        branch_id: companyData?.branch_id,
        is_sales_role: true, // Include all employees as potential assignees
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
