"use server"

import { createClient } from "@/lib/supabase"
import type { Lead } from "@/types/lead"
import { getAllLeadSources } from "@/utils/lead-source-utils"

export async function getAssignedLeads(): Promise<Lead[]> {
  const supabase = createClient()

  try {
    // First, get all the leads that are not unassigned and not rejected
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select(`
        *,
        companies:company_id(name),
        branches:branch_id(name)
      `)
      .not("status", "eq", "UNASSIGNED")
      .not("status", "eq", "REJECTED") // Exclude rejected leads
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

    // Fetch employee details if there are any employee IDs
    let employeesData: any[] = []
    if (employeeIds.length > 0) {
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .in("id", employeeIds)

      if (empError) {
        console.error("Error fetching employees:", empError)
      } else {
        employeesData = empData || []
      }
    }

    // Get all lead sources
    const leadSources = await getAllLeadSources()

    // Create maps for efficient lookups
    const employeeMap = new Map(employeesData.map((emp) => [emp.id, `${emp.first_name} ${emp.last_name}`]))

    const leadSourceIdMap = new Map(leadSources.map((source) => [source.id, source.name]))

    const leadSourceNameMap = new Map(leadSources.map((source) => [source.name.toLowerCase(), source.id]))

    // Process the leads data
    const processedLeads = await Promise.all(
      leadsData.map(async (lead) => {
        // Determine lead source name and ID
        let leadSourceName = "Not specified"
        let leadSourceId = undefined

        // Case 1: We have lead_source_id
        if (lead.lead_source_id) {
          leadSourceName = leadSourceIdMap.get(lead.lead_source_id) || "Unknown"
          leadSourceId = lead.lead_source_id
        }
        // Case 2: We have lead_source string but no ID
        else if (lead.lead_source) {
          leadSourceName = lead.lead_source
          leadSourceId = leadSourceNameMap.get(lead.lead_source.toLowerCase())
        }

        return {
          ...lead,
          company_name: lead.companies?.name,
          branch_name: lead.branches?.name,
          assigned_to_name: lead.assigned_to ? employeeMap.get(lead.assigned_to) : "Not assigned",
          lead_source_name: leadSourceName,
          lead_source_id: leadSourceId,
        }
      }),
    )

    return processedLeads
  } catch (error) {
    console.error("Exception fetching assigned leads:", error)
    return []
  }
}

export async function getLeadSources() {
  return getAllLeadSources()
}
