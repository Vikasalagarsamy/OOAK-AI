"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth-utils"

export async function getRejectedLeads() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required", data: [] }
    }

    const supabase = createClient()

    // Get rejected leads that were rejected by the current user
    const { data, error } = await supabase
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
        reassigned_at,
        company_id,
        companies:company_id(name),
        branch_id,
        branches:branch_id(name),
        reassigned_from_company_id,
        reassigned_from_company:reassigned_from_company_id(name),
        reassigned_from_branch_id,
        reassigned_from_branch:reassigned_from_branch_id(name),
        lead_rejections(
          id,
          rejection_reason,
          rejected_at,
          rejected_by
        )
      `)
      .eq("status", "REJECTED")
      .eq("lead_rejections.rejected_by", currentUser.employeeId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching rejected leads:", error)
      return { success: false, message: "Failed to fetch rejected leads", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching rejected leads:", error)
    return { success: false, message: "An unexpected error occurred", data: [] }
  }
}

export async function getCompaniesForReassignment(excludeCompanyId: number) {
  try {
    const supabase = createClient()

    // Get all active companies except the excluded one
    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .eq("status", "active")
      .neq("id", excludeCompanyId)
      .order("name")

    if (error) {
      console.error("Error fetching companies:", error)
      return { success: false, message: "Failed to fetch companies", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching companies:", error)
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
      return { success: false, message: "Failed to fetch branches", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error fetching branches:", error)
    return { success: false, message: "An unexpected error occurred", data: [] }
  }
}
