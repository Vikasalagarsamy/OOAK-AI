"use server"

import { createClient } from "@/lib/supabase/server"

export async function getRejectedLeads() {
  try {
    const supabase = createClient()

    // Check if the rejection_reason column exists
    let hasRejectionColumns = false
    try {
      const { data: columnExists, error: columnError } = await supabase.rpc("column_exists", {
        table_name: "leads",
        column_name: "rejection_reason",
      })

      if (!columnError && columnExists) {
        hasRejectionColumns = true
      }
    } catch (error) {
      console.error("Error checking for rejection_reason column:", error)
      // Continue with the assumption that the column might not exist
    }

    // Fetch rejected leads with different queries based on column existence
    let query = supabase
      .from("leads")
      .select(`
        id, 
        lead_number, 
        client_name, 
        status, 
        company_id, 
        branch_id,
        created_at,
        updated_at
      `)
      .eq("status", "REJECTED")
      .order("updated_at", { ascending: false })

    // Add rejection columns to the query if they exist
    if (hasRejectionColumns) {
      query = supabase
        .from("leads")
        .select(`
          id, 
          lead_number, 
          client_name, 
          status, 
          company_id, 
          branch_id,
          created_at,
          updated_at,
          rejection_reason,
          rejected_at,
          rejected_by
        `)
        .eq("status", "REJECTED")
        .order("updated_at", { ascending: false })
    }

    const { data: leads, error } = await query

    if (error) {
      console.error("Error fetching rejected leads:", error)
      return { success: false, message: error.message, data: [] }
    }

    if (!leads || leads.length === 0) {
      return { success: true, data: [] }
    }

    // Extract company and branch IDs for fetching related data
    const companyIds = [...new Set(leads.map((lead) => lead.company_id).filter(Boolean))]
    const branchIds = [...new Set(leads.map((lead) => lead.branch_id).filter(Boolean))]

    // Fetch companies
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds)

    if (companiesError) {
      console.error("Error fetching companies:", companiesError)
    }

    // Fetch branches
    const { data: branches, error: branchesError } = await supabase
      .from("branches")
      .select("id, name")
      .in("id", branchIds)

    if (branchesError) {
      console.error("Error fetching branches:", branchesError)
    }

    // Create lookup maps
    const companyMap = new Map()
    const branchMap = new Map()

    if (companies) {
      companies.forEach((company) => companyMap.set(company.id, company))
    }

    if (branches) {
      branches.forEach((branch) => branchMap.set(branch.id, branch))
    }

    // If we don't have rejection columns, try to get rejection info from activities
    const rejectionInfo = new Map()

    if (!hasRejectionColumns) {
      try {
        // Try to get rejection info from activities
        const { data: activities, error: activitiesError } = await supabase
          .from("activities")
          .select("*")
          .eq("action_type", "reject")
          .in(
            "entity_id",
            leads.map((lead) => lead.id.toString()),
          )

        if (!activitiesError && activities) {
          activities.forEach((activity) => {
            const leadId = Number.parseInt(activity.entity_id)
            if (!isNaN(leadId)) {
              rejectionInfo.set(leadId, {
                rejection_reason: activity.description.split("Reason: ")[1] || "No reason provided",
                rejected_at: activity.created_at,
                rejected_by: activity.user_name,
              })
            }
          })
        }
      } catch (error) {
        console.error("Error fetching activities:", error)
      }
    }

    // Process leads to include related data
    const processedLeads = leads.map((lead) => {
      const company = companyMap.get(lead.company_id)
      const branch = branchMap.get(lead.branch_id)

      // Get rejection info either from the lead itself or from activities
      let rejectionData = {}

      if (hasRejectionColumns) {
        rejectionData = {
          rejection_reason: lead.rejection_reason || "No reason provided",
          rejected_at: lead.rejected_at || lead.updated_at,
          rejected_by: lead.rejected_by || null,
        }
      } else {
        const activityInfo = rejectionInfo.get(lead.id)
        if (activityInfo) {
          rejectionData = activityInfo
        } else {
          rejectionData = {
            rejection_reason: "No reason provided",
            rejected_at: lead.updated_at,
            rejected_by: null,
          }
        }
      }

      return {
        ...lead,
        companies: company ? { name: company.name } : null,
        branches: branch ? { name: branch.name } : null,
        ...rejectionData,
      }
    })

    return { success: true, data: processedLeads }
  } catch (error) {
    console.error("Error in getRejectedLeads:", error)
    return { success: false, message: "An unexpected error occurred", data: [] }
  }
}

// Keep other existing functions
export async function getCompaniesForReassignment(excludeCompanyId: number) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .eq("status", "active")
      .neq("id", excludeCompanyId)
      .order("name")

    if (error) {
      console.error("Error fetching companies:", error)
      return { success: false, message: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error in getCompaniesForReassignment:", error)
    return { success: false, message: "An unexpected error occurred", data: [] }
  }
}

export async function getBranchesForCompany(companyId: number, excludeBranchId?: number | null) {
  try {
    const supabase = createClient()
    let query = supabase
      .from("branches")
      .select("id, name, location")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("name")

    // If excludeBranchId is provided and not null, exclude that branch
    if (excludeBranchId) {
      query = query.neq("id", excludeBranchId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching branches:", error)
      return { success: false, message: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error in getBranchesForCompany:", error)
    return { success: false, message: "An unexpected error occurred", data: [] }
  }
}
