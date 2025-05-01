"use server"

import { createClient } from "@/lib/supabase"
import type { Lead } from "@/types/lead"

export async function getAssignedLeads(): Promise<(Lead & { assigned_to_name?: string })[]> {
  const supabase = createClient()

  try {
    // Join with companies, branches, and employees to get their names
    const { data, error } = await supabase
      .from("leads")
      .select(`
        *,
        companies:company_id(name),
        branches:branch_id(name),
        employees:assigned_to(id, first_name, last_name)
      `)
      .not("status", "eq", "UNASSIGNED")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching assigned leads:", error)
      return []
    }

    // Transform the data to match our Lead type with assigned_to_name
    return data.map((lead) => ({
      ...lead,
      company_name: lead.companies?.name,
      branch_name: lead.branches?.name,
      assigned_to_name: lead.employees ? `${lead.employees.first_name} ${lead.employees.last_name}` : undefined,
    }))
  } catch (error) {
    console.error("Exception fetching assigned leads:", error)
    return []
  }
}

export async function getLeadsByStatus(status: string): Promise<(Lead & { assigned_to_name?: string })[]> {
  const supabase = createClient()

  try {
    // Join with companies, branches, and employees to get their names
    const { data, error } = await supabase
      .from("leads")
      .select(`
        *,
        companies:company_id(name),
        branches:branch_id(name),
        employees:assigned_to(id, first_name, last_name)
      `)
      .eq("status", status)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error(`Error fetching ${status} leads:`, error)
      return []
    }

    // Transform the data to match our Lead type with assigned_to_name
    return data.map((lead) => ({
      ...lead,
      company_name: lead.companies?.name,
      branch_name: lead.branches?.name,
      assigned_to_name: lead.employees ? `${lead.employees.first_name} ${lead.employees.last_name}` : undefined,
    }))
  } catch (error) {
    console.error(`Exception fetching ${status} leads:`, error)
    return []
  }
}
