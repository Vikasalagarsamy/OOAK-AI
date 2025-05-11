"use server"
import { createClient } from "@/lib/supabase/server"

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
          allocation_percentage
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

// Rest of the file remains the same...
