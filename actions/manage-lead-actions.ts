"use server"

import { query } from "@/lib/postgresql-client"
import type { Lead } from "@/types/lead"

export async function getAssignedLeads(): Promise<Lead[]> {
  try {
    console.log("📋 [MANAGE_LEADS] Fetching assigned leads via PostgreSQL...")

    // Get all the leads that are not unassigned and not rejected with related data in a single query
    const result = await query(`
      SELECT 
        l.*,
        c.name as company_name,
        b.name as branch_name,
        e.first_name,
        e.last_name,
        ls.name as lead_source_name
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN employees e ON l.assigned_to = e.id
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      WHERE l.status != 'UNASSIGNED'
      AND l.status != 'REJECTED'
      AND l.assigned_to IS NOT NULL
      ORDER BY l.updated_at DESC
    `)

    // Get all lead sources for mapping
    const leadSourcesResult = await query(`
      SELECT id, name FROM lead_sources WHERE is_active = true
    `)

    // Create maps for efficient lookups
    const leadSourceIdMap = new Map(leadSourcesResult.rows.map((source) => [source.id, source.name]))
    const leadSourceNameMap = new Map(leadSourcesResult.rows.map((source) => [source.name.toLowerCase(), source.id]))

    // Process the leads data
    const processedLeads = result.rows.map((lead) => {
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
        company_name: lead.company_name,
        branch_name: lead.branch_name,
        assigned_to_name: lead.first_name && lead.last_name 
          ? `${lead.first_name} ${lead.last_name}` 
          : "Not assigned",
          lead_source_name: leadSourceName,
          lead_source_id: leadSourceId,
        }
    })

    console.log(`✅ [MANAGE_LEADS] Fetched ${processedLeads.length} assigned leads`)
    return processedLeads
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Exception fetching assigned leads:", error)
    return []
  }
}

export async function getLeadSources() {
  try {
    console.log("📋 [MANAGE_LEADS] Fetching lead sources via PostgreSQL...")

    const result = await query(`
      SELECT id, name, description, is_active, sort_order
      FROM lead_sources 
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `)

    console.log(`✅ [MANAGE_LEADS] Fetched ${result.rows.length} active lead sources`)
    return result.rows
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Error fetching lead sources:", error)
    return []
  }
}

// Get leads by status
export async function getLeadsByStatus(status: string): Promise<Lead[]> {
  try {
    console.log(`📋 [MANAGE_LEADS] Fetching leads with status '${status}' via PostgreSQL...`)

    const result = await query(`
      SELECT 
        l.*,
        c.name as company_name,
        b.name as branch_name,
        e.first_name,
        e.last_name,
        ls.name as lead_source_name
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN employees e ON l.assigned_to = e.id
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      WHERE l.status = $1
      ORDER BY l.updated_at DESC
    `, [status])

    // Get all lead sources for mapping
    const leadSourcesResult = await query(`
      SELECT id, name FROM lead_sources WHERE is_active = true
    `)

    const leadSourceIdMap = new Map(leadSourcesResult.rows.map((source) => [source.id, source.name]))
    const leadSourceNameMap = new Map(leadSourcesResult.rows.map((source) => [source.name.toLowerCase(), source.id]))

    const processedLeads = result.rows.map((lead) => {
      let leadSourceName = "Not specified"
      let leadSourceId = undefined

      if (lead.lead_source_id) {
        leadSourceName = leadSourceIdMap.get(lead.lead_source_id) || "Unknown"
        leadSourceId = lead.lead_source_id
      } else if (lead.lead_source) {
        leadSourceName = lead.lead_source
        leadSourceId = leadSourceNameMap.get(lead.lead_source.toLowerCase())
      }

      return {
        ...lead,
        company_name: lead.company_name,
        branch_name: lead.branch_name,
        assigned_to_name: lead.first_name && lead.last_name 
          ? `${lead.first_name} ${lead.last_name}` 
          : "Not assigned",
        lead_source_name: leadSourceName,
        lead_source_id: leadSourceId,
      }
    })

    console.log(`✅ [MANAGE_LEADS] Fetched ${processedLeads.length} leads with status '${status}'`)
    return processedLeads
  } catch (error: any) {
    console.error(`❌ [MANAGE_LEADS] Exception fetching leads with status '${status}':`, error)
    return []
  }
}

// Get unassigned leads
export async function getUnassignedLeads(): Promise<Lead[]> {
  try {
    console.log("📋 [MANAGE_LEADS] Fetching unassigned leads via PostgreSQL...")

    const result = await query(`
      SELECT 
        l.*,
        c.name as company_name,
        b.name as branch_name,
        ls.name as lead_source_name
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      WHERE l.assigned_to IS NULL
      OR l.status = 'UNASSIGNED'
      ORDER BY l.created_at DESC
    `)

    const processedLeads = result.rows.map((lead) => ({
      ...lead,
      company_name: lead.company_name,
      branch_name: lead.branch_name,
      assigned_to_name: "Unassigned",
      lead_source_name: lead.lead_source_name || lead.lead_source || "Not specified",
    }))

    console.log(`✅ [MANAGE_LEADS] Fetched ${processedLeads.length} unassigned leads`)
    return processedLeads
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Exception fetching unassigned leads:", error)
    return []
  }
}

// Get lead summary statistics
export async function getLeadSummaryStats() {
  try {
    console.log("📊 [MANAGE_LEADS] Fetching lead summary statistics via PostgreSQL...")

    const result = await query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'NEW') as new_leads,
        COUNT(*) FILTER (WHERE status = 'CONTACTED') as contacted_leads,
        COUNT(*) FILTER (WHERE status = 'QUALIFIED') as qualified_leads,
        COUNT(*) FILTER (WHERE status = 'PROPOSAL') as proposal_leads,
        COUNT(*) FILTER (WHERE status = 'NEGOTIATION') as negotiation_leads,
        COUNT(*) FILTER (WHERE status = 'CLOSED_WON') as won_leads,
        COUNT(*) FILTER (WHERE status = 'CLOSED_LOST') as lost_leads,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_leads,
        COUNT(*) FILTER (WHERE assigned_to IS NULL OR status = 'UNASSIGNED') as unassigned_leads,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as leads_this_week,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_this_month
      FROM leads
    `)

    const stats = result.rows[0] || {}

    // Convert string counts to numbers
    Object.keys(stats).forEach(key => {
      stats[key] = parseInt(stats[key]) || 0
    })

    console.log(`✅ [MANAGE_LEADS] Generated lead summary: ${stats.total_leads} total leads`)
    return {
      success: true,
      stats
    }
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Error fetching lead summary stats:", error)
    return {
      success: false,
      error: "Failed to fetch lead summary statistics"
    }
  }
}

// Search leads by criteria
export async function searchLeads(searchCriteria: {
  query?: string
  status?: string
  leadSource?: string
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
}): Promise<Lead[]> {
  try {
    console.log("🔍 [MANAGE_LEADS] Searching leads via PostgreSQL...", searchCriteria)

    let whereConditions: string[] = []
    let params: any[] = []
    let paramIndex = 1

    // Text search across multiple fields
    if (searchCriteria.query) {
      whereConditions.push(`(
        l.client_name ILIKE $${paramIndex} OR 
        l.client_email ILIKE $${paramIndex} OR 
        l.client_phone ILIKE $${paramIndex} OR 
        l.lead_number ILIKE $${paramIndex}
      )`)
      params.push(`%${searchCriteria.query}%`)
      paramIndex++
    }

    // Status filter
    if (searchCriteria.status) {
      whereConditions.push(`l.status = $${paramIndex}`)
      params.push(searchCriteria.status)
      paramIndex++
    }

    // Lead source filter
    if (searchCriteria.leadSource) {
      whereConditions.push(`l.lead_source_id = $${paramIndex}`)
      params.push(parseInt(searchCriteria.leadSource))
      paramIndex++
    }

    // Assigned to filter
    if (searchCriteria.assignedTo) {
      whereConditions.push(`l.assigned_to = $${paramIndex}`)
      params.push(parseInt(searchCriteria.assignedTo))
      paramIndex++
    }

    // Date range filters
    if (searchCriteria.dateFrom) {
      whereConditions.push(`l.created_at >= $${paramIndex}`)
      params.push(searchCriteria.dateFrom)
      paramIndex++
    }

    if (searchCriteria.dateTo) {
      whereConditions.push(`l.created_at <= $${paramIndex}`)
      params.push(searchCriteria.dateTo)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const result = await query(`
      SELECT 
        l.*,
        c.name as company_name,
        b.name as branch_name,
        e.first_name,
        e.last_name,
        ls.name as lead_source_name
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN employees e ON l.assigned_to = e.id
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      ${whereClause}
      ORDER BY l.updated_at DESC
      LIMIT 100
    `, params)

    const searchResults = result.rows.map((lead) => ({
      ...lead,
      company_name: lead.company_name,
      branch_name: lead.branch_name,
      assigned_to_name: lead.first_name && lead.last_name 
        ? `${lead.first_name} ${lead.last_name}` 
        : "Not assigned",
      lead_source_name: lead.lead_source_name || lead.lead_source || "Not specified",
    }))

    console.log(`✅ [MANAGE_LEADS] Search returned ${searchResults.length} leads`)
    return searchResults
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Exception in searchLeads:", error)
    return []
  }
}
