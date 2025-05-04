"use server"

import { createClient } from "@/lib/supabase"
import type { Lead } from "@/types/lead"

export async function getAssignedLeads(): Promise<(Lead & { assigned_to_name?: string })[]> {
  const supabase = createClient()

  try {
    // First, get all the leads that are not unassigned
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select(`
        *,
        companies:company_id(name),
        branches:branch_id(name)
      `)
      .not("status", "eq", "UNASSIGNED")
      .not("assigned_to", "is", null)
      .order("updated_at", { ascending: false })

    if (leadsError) {
      console.error("Error fetching assigned leads:", leadsError)
      return []
    }

    // Get all employee IDs from the leads
    const employeeIds = leadsData
      .map((lead) => lead.assigned_to)
      .filter((id): id is number => id !== null && id !== undefined)

    // Get all lead source IDs from the leads
    const leadSourceIds = leadsData
      .map((lead) => lead.lead_source_id)
      .filter((id): id is number => id !== null && id !== undefined)

    // Prepare promises for fetching related data
    const promises = []

    // Fetch employee details if there are any employee IDs
    let employeesData: any[] = []
    if (employeeIds.length > 0) {
      promises.push(
        supabase
          .from("employees")
          .select("id, first_name, last_name")
          .in("id", employeeIds)
          .then(({ data, error }) => {
            if (error) {
              console.error("Error fetching employees:", error)
              return []
            }
            employeesData = data || []
            return data
          }),
      )
    }

    // Fetch lead source details if there are any lead source IDs
    let leadSourcesData: any[] = []
    if (leadSourceIds.length > 0) {
      promises.push(
        supabase
          .from("lead_sources")
          .select("id, name")
          .in("id", leadSourceIds)
          .then(({ data, error }) => {
            if (error) {
              console.error("Error fetching lead sources:", error)
              return []
            }
            leadSourcesData = data || []
            return data
          }),
      )
    }

    // Wait for all promises to resolve
    await Promise.all(promises)

    // Create maps for efficient lookups
    const employeeMap = new Map(employeesData.map((emp) => [emp.id, `${emp.first_name} ${emp.last_name}`]))
    const leadSourceMap = new Map(leadSourcesData.map((source) => [source.id, source.name]))

    // Combine the lead data with employee names and lead source names
    return leadsData.map((lead) => ({
      ...lead,
      company_name: lead.companies?.name,
      branch_name: lead.branches?.name,
      assigned_to_name: lead.assigned_to ? employeeMap.get(lead.assigned_to) : undefined,
      lead_source_name: lead.lead_source_id ? leadSourceMap.get(lead.lead_source_id) : undefined,
    }))
  } catch (error) {
    console.error("Exception fetching assigned leads:", error)
    return []
  }
}

export async function getLeadsByStatus(status: string): Promise<(Lead & { assigned_to_name?: string })[]> {
  const supabase = createClient()

  try {
    // First, get all the leads with the specified status
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select(`
        *,
        companies:company_id(name),
        branches:branch_id(name)
      `)
      .eq("status", status)
      .order("updated_at", { ascending: false })

    if (leadsError) {
      console.error(`Error fetching ${status} leads:`, leadsError)
      return []
    }

    // Get all employee IDs from the leads
    const employeeIds = leadsData
      .map((lead) => lead.assigned_to)
      .filter((id): id is number => id !== null && id !== undefined)

    // Get all lead source IDs from the leads
    const leadSourceIds = leadsData
      .map((lead) => lead.lead_source_id)
      .filter((id): id is number => id !== null && id !== undefined)

    // Prepare promises for fetching related data
    const promises = []

    // Fetch employee details if there are any employee IDs
    let employeesData: any[] = []
    if (employeeIds.length > 0) {
      promises.push(
        supabase
          .from("employees")
          .select("id, first_name, last_name")
          .in("id", employeeIds)
          .then(({ data, error }) => {
            if (error) {
              console.error("Error fetching employees:", error)
              return []
            }
            employeesData = data || []
            return data
          }),
      )
    }

    // Fetch lead source details if there are any lead source IDs
    let leadSourcesData: any[] = []
    if (leadSourceIds.length > 0) {
      promises.push(
        supabase
          .from("lead_sources")
          .select("id, name")
          .in("id", leadSourceIds)
          .then(({ data, error }) => {
            if (error) {
              console.error("Error fetching lead sources:", error)
              return []
            }
            leadSourcesData = data || []
            return data
          }),
      )
    }

    // Wait for all promises to resolve
    await Promise.all(promises)

    // Create maps for efficient lookups
    const employeeMap = new Map(employeesData.map((emp) => [emp.id, `${emp.first_name} ${emp.last_name}`]))
    const leadSourceMap = new Map(leadSourcesData.map((source) => [source.id, source.name]))

    // Combine the lead data with employee names and lead source names
    return leadsData.map((lead) => ({
      ...lead,
      company_name: lead.companies?.name,
      branch_name: lead.branches?.name,
      assigned_to_name: lead.assigned_to ? employeeMap.get(lead.assigned_to) : undefined,
      lead_source_name: lead.lead_source_id ? leadSourceMap.get(lead.lead_source_id) : undefined,
    }))
  } catch (error) {
    console.error(`Exception fetching ${status} leads:`, error)
    return []
  }
}

export async function getLeadSources() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("lead_sources").select("id, name").order("name")

    if (error) {
      console.error("Error fetching lead sources:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Exception fetching lead sources:", error)
    return []
  }
}
