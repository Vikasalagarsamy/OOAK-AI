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

    // Fetch all lead sources to map names
    let leadSourcesData: any[] = []
    promises.push(
      supabase
        .from("lead_sources")
        .select("id, name")
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching lead sources:", error)
            return []
          }
          leadSourcesData = data || []
          return data
        }),
    )

    // Wait for all promises to resolve
    await Promise.all(promises)

    // Create maps for efficient lookups
    const employeeMap = new Map(employeesData.map((emp) => [emp.id, `${emp.first_name} ${emp.last_name}`]))

    // Create a map of lead source names to their IDs
    const leadSourceNameToIdMap = new Map(leadSourcesData.map((source) => [source.name.toLowerCase(), source.id]))
    const leadSourceIdToNameMap = new Map(leadSourcesData.map((source) => [source.id, source.name]))

    // Combine the lead data with employee names and lead source names
    return leadsData.map((lead) => {
      // Try to find a matching lead source ID based on the lead_source string
      let leadSourceId = undefined
      let leadSourceName = undefined

      if (lead.lead_source_id) {
        // If lead_source_id exists, use it directly
        leadSourceId = lead.lead_source_id
        leadSourceName = leadSourceIdToNameMap.get(lead.lead_source_id)
      } else if (lead.lead_source) {
        // If only lead_source string exists, try to find matching ID
        leadSourceId = leadSourceNameToIdMap.get(lead.lead_source.toLowerCase())
        leadSourceName = lead.lead_source
      }

      return {
        ...lead,
        company_name: lead.companies?.name,
        branch_name: lead.branches?.name,
        assigned_to_name: lead.assigned_to ? employeeMap.get(lead.assigned_to) : undefined,
        lead_source_name: leadSourceName || lead.lead_source || "Not specified",
        // Add lead_source_id if we found a match
        lead_source_id: leadSourceId,
      }
    })
  } catch (error) {
    console.error("Exception fetching assigned leads:", error)
    return []
  }
}

// Update the getLeadsByStatus function similarly
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

    // Fetch all lead sources to map names
    let leadSourcesData: any[] = []
    promises.push(
      supabase
        .from("lead_sources")
        .select("id, name")
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching lead sources:", error)
            return []
          }
          leadSourcesData = data || []
          return data
        }),
    )

    // Wait for all promises to resolve
    await Promise.all(promises)

    // Create maps for efficient lookups
    const employeeMap = new Map(employeesData.map((emp) => [emp.id, `${emp.first_name} ${emp.last_name}`]))

    // Create a map of lead source names to their IDs
    const leadSourceNameToIdMap = new Map(leadSourcesData.map((source) => [source.name.toLowerCase(), source.id]))
    const leadSourceIdToNameMap = new Map(leadSourcesData.map((source) => [source.id, source.name]))

    // Combine the lead data with employee names and lead source names
    return leadsData.map((lead) => {
      // Try to find a matching lead source ID based on the lead_source string
      let leadSourceId = undefined
      let leadSourceName = undefined

      if (lead.lead_source_id) {
        // If lead_source_id exists, use it directly
        leadSourceId = lead.lead_source_id
        leadSourceName = leadSourceIdToNameMap.get(lead.lead_source_id)
      } else if (lead.lead_source) {
        // If only lead_source string exists, try to find matching ID
        leadSourceId = leadSourceNameToIdMap.get(lead.lead_source.toLowerCase())
        leadSourceName = lead.lead_source
      }

      return {
        ...lead,
        company_name: lead.companies?.name,
        branch_name: lead.branches?.name,
        assigned_to_name: lead.assigned_to ? employeeMap.get(lead.assigned_to) : undefined,
        lead_source_name: leadSourceName || lead.lead_source || "Not specified",
        // Add lead_source_id if we found a match
        lead_source_id: leadSourceId,
      }
    })
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
