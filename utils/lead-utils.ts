import { createClient } from "@/lib/supabase"

export async function getLeadWithDetails(id: string) {
  const supabase = createClient()

  try {
    // Get lead data
    const { data: lead, error } = await supabase
      .from("leads")
      .select(`
        *,
        companies:company_id(name),
        branches:branch_id(name)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching lead:", error)
      return null
    }

    // Get employee data if assigned
    let assignedToName = null
    let assignedToRole = null

    if (lead.assigned_to) {
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id, first_name, last_name, job_title")
        .eq("id", lead.assigned_to)
        .single()

      if (!employeeError && employee) {
        assignedToName = `${employee.first_name} ${employee.last_name}`
        assignedToRole = employee.job_title
      } else {
        console.error("Error fetching employee:", employeeError)
      }
    }

    // Return enriched lead data
    return {
      ...lead,
      company_name: lead.companies?.name,
      branch_name: lead.branches?.name,
      assigned_to_name: assignedToName,
      assigned_to_role: assignedToRole,
      lead_source_name: lead.lead_source,
    }
  } catch (err) {
    console.error("Unexpected error fetching lead:", err)
    return null
  }
}
