"use server"

import { createClient } from "@/lib/supabase/server"

export async function debugLeadReassignment(leadNumber: string) {
  const supabase = createClient()

  try {
    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("lead_number", leadNumber)
      .single()

    if (leadError) {
      return { error: `Error fetching lead: ${leadError.message}` }
    }

    // Get branch data
    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("*")
      .eq("id", lead.branch_id)
      .single()

    if (branchError) {
      return { error: `Error fetching branch: ${branchError.message}` }
    }

    // Get current assignee
    const { data: currentAssignee, error: assigneeError } = await supabase
      .from("employees")
      .select("*, employee_companies!inner(*)")
      .eq("id", lead.assigned_to)
      .single()

    if (assigneeError && assigneeError.code !== "PGRST116") {
      return { error: `Error fetching current assignee: ${assigneeError.message}` }
    }

    // Get potential assignees
    const { data: potentialAssignees, error: potentialError } = await supabase
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
      .eq("employee_companies.company_id", lead.company_id)
      .eq("status", "ACTIVE")

    if (potentialError) {
      return { error: `Error fetching potential assignees: ${potentialError.message}` }
    }

    return {
      lead,
      branch,
      currentAssignee,
      potentialAssignees: potentialAssignees.filter((emp) => emp.id !== lead.assigned_to),
      message: "Debug data retrieved successfully",
    }
  } catch (error) {
    return { error: `Exception in debugLeadReassignment: ${error}` }
  }
}
