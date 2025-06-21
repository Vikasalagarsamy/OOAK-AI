"use server"

import { query } from "@/lib/postgresql-client"
import type { Lead } from "@/types/lead"

export async function getAssignedLeads(): Promise<(Lead & { assigned_to_name?: string })[]> {
  try {
    console.log("📋 [MANAGE_LEADS] Fetching assigned leads via PostgreSQL...")

    // Get all the leads that are not unassigned with related data
    const leadsResult = await query(`
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
      AND l.assigned_to IS NOT NULL
      ORDER BY l.updated_at DESC
    `)

    const leads = leadsResult.rows.map((lead) => {
      // Construct assigned_to_name from employee data
      const assigned_to_name = lead.first_name && lead.last_name 
        ? `${lead.first_name} ${lead.last_name}` 
        : undefined

      // Handle lead source mapping
      let leadSourceName = lead.lead_source_name || lead.lead_source || "Not specified"
      let leadSourceId = lead.lead_source_id

      // If we have a lead_source string but no ID, try to map it
      if (lead.lead_source && !lead.lead_source_id) {
        // This would be handled by a separate query if needed
        leadSourceName = lead.lead_source
      }

      return {
        ...lead,
        company_name: lead.company_name,
        branch_name: lead.branch_name,
        assigned_to_name,
        lead_source_name: leadSourceName,
        lead_source_id: leadSourceId,
      }
    })

    console.log(`✅ [MANAGE_LEADS] Fetched ${leads.length} assigned leads`)
    return leads
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Exception fetching assigned leads:", error)
    return []
  }
}

// Update the getLeadsByStatus function
export async function getLeadsByStatus(status: string): Promise<(Lead & { assigned_to_name?: string })[]> {
  try {
    console.log(`📋 [MANAGE_LEADS] Fetching ${status} leads via PostgreSQL...`)

    // Get all the leads with the specified status with related data
    const leadsResult = await query(`
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

    const leads = leadsResult.rows.map((lead) => {
      // Construct assigned_to_name from employee data
      const assigned_to_name = lead.first_name && lead.last_name 
        ? `${lead.first_name} ${lead.last_name}` 
        : undefined

      // Handle lead source mapping
      let leadSourceName = lead.lead_source_name || lead.lead_source || "Not specified"
      let leadSourceId = lead.lead_source_id

      // If we have a lead_source string but no ID, try to map it
      if (lead.lead_source && !lead.lead_source_id) {
        leadSourceName = lead.lead_source
      }

      return {
        ...lead,
        company_name: lead.company_name,
        branch_name: lead.branch_name,
        assigned_to_name,
        lead_source_name: leadSourceName,
        lead_source_id: leadSourceId,
      }
    })

    console.log(`✅ [MANAGE_LEADS] Fetched ${leads.length} ${status} leads`)
    return leads
  } catch (error: any) {
    console.error(`❌ [MANAGE_LEADS] Exception fetching ${status} leads:`, error)
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
    console.error("❌ [MANAGE_LEADS] Exception fetching lead sources:", error)
    return []
  }
}

// Get lead details by ID
export async function getLeadById(leadId: number): Promise<(Lead & { assigned_to_name?: string; company_name?: string; branch_name?: string }) | null> {
  try {
    console.log(`🔍 [MANAGE_LEADS] Fetching lead ${leadId} details via PostgreSQL...`)

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
      WHERE l.id = $1
    `, [leadId])

    if (result.rows.length === 0) {
      console.log(`⚠️ [MANAGE_LEADS] Lead ${leadId} not found`)
      return null
    }

    const lead = result.rows[0]
    const assigned_to_name = lead.first_name && lead.last_name 
      ? `${lead.first_name} ${lead.last_name}` 
      : undefined

    console.log(`✅ [MANAGE_LEADS] Found lead ${lead.lead_number}`)
    return {
      ...lead,
      assigned_to_name,
      lead_source_name: lead.lead_source_name || lead.lead_source || "Not specified"
    }
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Exception fetching lead by ID:", error)
    return null
  }
}

// Update lead status
export async function updateLeadStatus(leadId: number, newStatus: string, notes?: string) {
  try {
    console.log(`📝 [MANAGE_LEADS] Updating lead ${leadId} status to ${newStatus} via PostgreSQL...`)

    const result = await query(`
      UPDATE leads 
      SET 
        status = $1,
        updated_at = NOW(),
        status_notes = COALESCE($2, status_notes)
      WHERE id = $3
      RETURNING id, lead_number, status
    `, [newStatus, notes, leadId])

    if (result.rowCount === 0) {
      return {
        success: false,
        message: "Lead not found or could not be updated"
      }
    }

    const updatedLead = result.rows[0]

    // Log the status change
    await query(`
      INSERT INTO lead_activity_logs (
        lead_id,
        activity_type,
        description,
        created_at
      ) VALUES (
        $1,
        'STATUS_CHANGE',
        $2,
        NOW()
      )
    `, [
      leadId,
      `Status changed to ${newStatus}${notes ? `. Notes: ${notes}` : ''}`
    ])

    console.log(`✅ [MANAGE_LEADS] Updated lead ${updatedLead.lead_number} status to ${newStatus}`)
    return {
      success: true,
      message: `Lead status updated to ${newStatus}`,
      lead: updatedLead
    }
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Exception updating lead status:", error)
    return {
      success: false,
      message: `Failed to update lead status: ${error.message}`
    }
  }
}

// Get lead activity logs
export async function getLeadActivityLogs(leadId: number) {
  try {
    console.log(`📋 [MANAGE_LEADS] Fetching activity logs for lead ${leadId} via PostgreSQL...`)

    const result = await query(`
      SELECT 
        id,
        activity_type,
        description,
        created_at,
        created_by
      FROM lead_activity_logs
      WHERE lead_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [leadId])

    console.log(`✅ [MANAGE_LEADS] Found ${result.rows.length} activity logs for lead ${leadId}`)
    return result.rows
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Exception fetching lead activity logs:", error)
    return []
  }
}

// Get leads summary statistics
export async function getLeadsSummary() {
  try {
    console.log("📊 [MANAGE_LEADS] Fetching leads summary statistics via PostgreSQL...")

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
        COUNT(*) FILTER (WHERE assigned_to IS NULL) as unassigned_leads,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as leads_this_week,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_this_month
      FROM leads
    `)

    const summary = result.rows[0] || {}

    // Convert string counts to numbers
    Object.keys(summary).forEach(key => {
      summary[key] = parseInt(summary[key]) || 0
    })

    console.log(`✅ [MANAGE_LEADS] Generated leads summary: ${summary.total_leads} total leads`)
    return summary
  } catch (error: any) {
    console.error("❌ [MANAGE_LEADS] Exception fetching leads summary:", error)
    return {
      total_leads: 0,
      new_leads: 0,
      contacted_leads: 0,
      qualified_leads: 0,
      proposal_leads: 0,
      negotiation_leads: 0,
      won_leads: 0,
      lost_leads: 0,
      rejected_leads: 0,
      unassigned_leads: 0,
      leads_this_week: 0,
      leads_this_month: 0
    }
  }
}
