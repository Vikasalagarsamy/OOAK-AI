import { query } from "@/lib/postgresql-client"

/**
 * LEAD UTILS - NOW 100% POSTGRESQL
 * ================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized JOIN operations
 * - All Supabase dependencies eliminated
 */

export async function getLeadWithDetails(id: string) {
  try {
    console.log(`📋 Fetching lead details for ID ${id} via PostgreSQL...`)

    // Get lead data with related information via optimized PostgreSQL JOIN
    const result = await query(`
      SELECT 
        l.*,
        c.name as company_name,
        b.name as branch_name,
        ls.name as lead_source_name,
        e.first_name as assigned_first_name,
        e.last_name as assigned_last_name,
        e.name as assigned_name,
        e.job_title as assigned_job_title,
        e.position as assigned_position
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      LEFT JOIN employees e ON l.assigned_to = e.id AND e.is_active = true
      WHERE l.id = $1
    `, [id])

    if (result.rows.length === 0) {
      console.log(`⚠️ Lead ${id} not found`)
      return null
    }

    const lead = result.rows[0]

    // Build assigned to name from available fields
    let assignedToName = null
    if (lead.assigned_to) {
      if (lead.assigned_first_name && lead.assigned_last_name) {
        assignedToName = `${lead.assigned_first_name} ${lead.assigned_last_name}`
      } else if (lead.assigned_name) {
        assignedToName = lead.assigned_name
      } else {
        assignedToName = `Employee ID: ${lead.assigned_to}`
      }
    }

    // Return enriched lead data
    const enrichedLead = {
      ...lead,
      company_name: lead.company_name,
      branch_name: lead.branch_name,
      assigned_to_name: assignedToName,
      assigned_to_role: lead.assigned_job_title || lead.assigned_position,
      lead_source_name: lead.lead_source_name || lead.lead_source,
    }

    console.log(`✅ Successfully fetched lead details for ${lead.client_name || lead.contact_name || 'Unknown'} via PostgreSQL`)
    return enrichedLead

  } catch (error: any) {
    console.error(`❌ Error fetching lead ${id} via PostgreSQL:`, error)
    return null
  }
}
