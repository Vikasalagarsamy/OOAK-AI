"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/permission-utils"

export async function getMyLeads() {
  try {
    const supabase = createClient()

    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.email) {
      return {
        data: null,
        error: "You must be logged in to view your leads",
      }
    }

    // Find the employee record for the current user
    // Instead of using .single(), we'll handle multiple or no results
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email")
      .eq("email", currentUser.email)

    if (employeeError) {
      console.error("Error fetching employee data:", employeeError)
      return {
        data: null,
        error: `Error finding your employee record: ${employeeError.message}`,
      }
    }

    // Check if we have any employee records
    if (!employeeData || employeeData.length === 0) {
      console.warn(`No employee record found for email: ${currentUser.email}`)
      return {
        data: [],
        error: "No employee record found for your user account. Please contact your administrator.",
      }
    }

    // If we have multiple employee records with the same email, use the first one
    // This is a fallback - ideally emails should be unique
    const employee = employeeData[0]
    console.log(`Found employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`)

    // Get leads assigned to this employee, excluding rejected leads
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select(`
        id,
        lead_number,
        client_name,
        client_email,
        client_phone,
        status,
        created_at,
        updated_at,
        lead_source_id,
        branch_id,
        company_id,
        notes
      `)
      .eq("assigned_to", employee.id)
      .neq("status", "REJECTED") // Exclude rejected leads
      .order("created_at", { ascending: false })

    if (leadsError) {
      console.error("Error fetching leads:", leadsError)
      return {
        data: null,
        error: `Error fetching your leads: ${leadsError.message}`,
      }
    }

    // If no leads are found, return an empty array
    if (!leadsData || leadsData.length === 0) {
      return {
        data: [],
        error: null,
      }
    }

    // Get all unique company IDs, branch IDs, and lead source IDs
    const companyIds = [...new Set(leadsData.filter((lead) => lead.company_id).map((lead) => lead.company_id))]
    const branchIds = [...new Set(leadsData.filter((lead) => lead.branch_id).map((lead) => lead.branch_id))]
    const leadSourceIds = [
      ...new Set(leadsData.filter((lead) => lead.lead_source_id).map((lead) => lead.lead_source_id)),
    ]

    // Fetch all companies, branches, and lead sources in batch
    const [companiesResponse, branchesResponse, leadSourcesResponse] = await Promise.all([
      companyIds.length > 0 ? supabase.from("companies").select("id, name").in("id", companyIds) : { data: [] },
      branchIds.length > 0 ? supabase.from("branches").select("id, name").in("id", branchIds) : { data: [] },
      leadSourceIds.length > 0
        ? supabase.from("lead_sources").select("id, name").in("id", leadSourceIds)
        : { data: [] },
    ])

    // Create lookup maps
    const companyMap = new Map(companiesResponse.data?.map((company) => [company.id, company.name]) || [])
    const branchMap = new Map(branchesResponse.data?.map((branch) => [branch.id, branch.name]) || [])
    const leadSourceMap = new Map(leadSourcesResponse.data?.map((source) => [source.id, source.name]) || [])

    // Enrich the leads data with related information
    const enrichedLeads = leadsData.map((lead) => ({
      ...lead,
      company_name: lead.company_id ? companyMap.get(lead.company_id) : null,
      branch_name: lead.branch_id ? branchMap.get(lead.branch_id) : null,
      lead_source_name: lead.lead_source_id ? leadSourceMap.get(lead.lead_source_id) : null,
      assigned_to_name: `${employee.first_name} ${employee.last_name}`,
    }))

    return {
      data: enrichedLeads,
      error: null,
    }
  } catch (error) {
    console.error("Error in getMyLeads:", error)
    return {
      data: null,
      error: `An unexpected error occurred: ${error.message}`,
    }
  }
}
