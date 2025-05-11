"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

interface Employee {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  full_name: string
  job_title?: string
  location?: string
  is_sales_role?: boolean
  company_id?: number | null
  branch_id?: number | null
}

export async function getEmployeesByCompanyAndBranch(
  companyId: number,
  branchId: number | null,
  location: string | null,
): Promise<Employee[]> {
  const supabase = createClient()

  try {
    // Start with a query that filters by company
    let query = supabase
      .from("employees")
      .select(
        `
        id, 
        employee_id, 
        first_name, 
        last_name, 
        job_title,
        employee_companies!inner(company_id, branch_id, is_primary, location)
      `,
      )
      .eq("employee_companies.company_id", companyId)
      .eq("status", "ACTIVE")

    // If branch ID is provided, filter by branch as well
    if (branchId) {
      query = query.eq("employee_companies.branch_id", branchId)
    }

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("Error fetching employees by company and branch:", error)
      return []
    }

    // Process the results to get a flat list of employees with their company info
    const employees = data.map((emp) => {
      // Extract the employee_companies data
      const companyData = Array.isArray(emp.employee_companies) ? emp.employee_companies[0] : emp.employee_companies

      return {
        id: emp.id,
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        full_name: `${emp.first_name} ${emp.last_name}`,
        job_title: emp.job_title,
        company_id: companyData?.company_id,
        branch_id: companyData?.branch_id,
        location: companyData?.location,
        // Determine if this is a sales role based on job title
        is_sales_role: emp.job_title
          ? emp.job_title.toLowerCase().includes("sales") ||
            emp.job_title.toLowerCase().includes("account") ||
            emp.job_title.toLowerCase().includes("business development")
          : false,
      }
    })

    // If location is provided, prioritize employees in that location but don't exclude others
    if (location) {
      return employees.sort((a, b) => {
        const aMatchesLocation = (a.location || "").toLowerCase() === location.toLowerCase()
        const bMatchesLocation = (b.location || "").toLowerCase() === location.toLowerCase()

        if (aMatchesLocation && !bMatchesLocation) return -1
        if (!aMatchesLocation && bMatchesLocation) return 1
        return 0
      })
    }

    return employees
  } catch (error) {
    console.error("Exception fetching employees by company and branch:", error)
    return []
  }
}

export async function reassignLead(leadId: string, employeeId: string) {
  const supabase = createClient()

  try {
    // Validate inputs
    const leadIdNum = Number.parseInt(leadId, 10)
    const employeeIdNum = Number.parseInt(employeeId, 10)

    if (isNaN(leadIdNum) || isNaN(employeeIdNum)) {
      return {
        success: false,
        error: "Invalid lead ID or employee ID",
      }
    }

    // Get the current lead data for logging
    const { data: currentLead, error: fetchError } = await supabase
      .from("leads")
      .select("assigned_to, lead_number, client_name")
      .eq("id", leadIdNum)
      .single()

    if (fetchError) {
      console.error("Error fetching lead for reassignment:", fetchError)
      return {
        success: false,
        error: "Failed to fetch lead information",
      }
    }

    // Get the employee data for logging
    const { data: employeeData, error: empError } = await supabase
      .from("employees")
      .select("first_name, last_name")
      .eq("id", employeeIdNum)
      .single()

    if (empError) {
      console.error("Error fetching employee for reassignment:", empError)
      return {
        success: false,
        error: "Failed to fetch employee information",
      }
    }

    // Update the lead's assigned_to field
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeIdNum,
        status: currentLead.assigned_to ? "ASSIGNED" : "ASSIGNED", // Keep status if already assigned, change to ASSIGNED if it was UNASSIGNED
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadIdNum)

    if (updateError) {
      console.error("Error reassigning lead:", updateError)
      return {
        success: false,
        error: "Failed to reassign lead",
      }
    }

    // Log the reassignment in the activities table
    const { error: logError } = await supabase.from("activities").insert({
      activity_type: "LEAD_REASSIGNED",
      entity_type: "LEAD",
      entity_id: leadIdNum,
      description: `Lead ${currentLead.lead_number} (${
        currentLead.client_name
      }) reassigned to ${employeeData.first_name} ${employeeData.last_name} at ${new Date().toISOString()}`,
      created_at: new Date().toISOString(),
      user_id: "system", // Replace with actual user ID if available
    })

    if (logError) {
      console.error("Error logging lead reassignment:", logError)
      // Continue despite logging error
    }

    // Revalidate the leads pages
    revalidatePath("/sales/manage-lead")
    revalidatePath(`/sales/lead/${leadId}`)

    return {
      success: true,
      message: `Lead successfully reassigned to ${employeeData.first_name} ${employeeData.last_name}`,
    }
  } catch (error) {
    console.error("Exception in reassignLead:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
