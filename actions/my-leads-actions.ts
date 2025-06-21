"use server"

import { query } from "@/lib/postgresql-client"
import { getCurrentUser } from "@/lib/permission-utils"

export async function getMyLeads() {
  try {
    console.log("👤 [MY_LEADS] Fetching current user's leads via PostgreSQL...")

    // Get the current user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.email) {
      return {
        data: null,
        error: "You must be logged in to view your leads",
      }
    }

    console.log(`👤 [MY_LEADS] Looking up employee record for email: ${currentUser.email}`)

    // Find the employee record for the current user
    const employeeResult = await query(`
      SELECT id, first_name, last_name, email
      FROM employees
      WHERE email = $1
      AND status = 'active'
    `, [currentUser.email])

    if (employeeResult.rows.length === 0) {
      console.warn(`⚠️ [MY_LEADS] No employee record found for email: ${currentUser.email}`)
      return {
        data: [],
        error: "No employee record found for your user account. Please contact your administrator.",
      }
    }

    // If we have multiple employee records with the same email, use the first one
    const employee = employeeResult.rows[0]
    console.log(`✅ [MY_LEADS] Found employee: ${employee.first_name} ${employee.last_name} (ID: ${employee.id})`)

    // Get leads assigned to this employee, excluding rejected leads, with all related data in one query
    const leadsResult = await query(`
      SELECT 
        l.id,
        l.lead_number,
        l.client_name,
        l.client_email,
        l.client_phone,
        l.status,
        l.created_at,
        l.updated_at,
        l.lead_source_id,
        l.branch_id,
        l.company_id,
        l.notes,
        c.name as company_name,
        b.name as branch_name,
        ls.name as lead_source_name
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      WHERE l.assigned_to = $1
      AND l.status != 'REJECTED'
      ORDER BY l.created_at DESC
    `, [employee.id])

    // If no leads are found, return an empty array
    if (leadsResult.rows.length === 0) {
      console.log(`ℹ️ [MY_LEADS] No leads found for employee ${employee.first_name} ${employee.last_name}`)
      return {
        data: [],
        error: null,
      }
    }

    // Enrich the leads data with related information
    const enrichedLeads = leadsResult.rows.map((lead) => ({
      ...lead,
      company_name: lead.company_name,
      branch_name: lead.branch_name,
      lead_source_name: lead.lead_source_name,
      assigned_to_name: `${employee.first_name} ${employee.last_name}`,
    }))

    console.log(`✅ [MY_LEADS] Found ${enrichedLeads.length} leads for ${employee.first_name} ${employee.last_name}`)

    return {
      data: enrichedLeads,
      error: null,
    }
  } catch (error: any) {
    console.error("❌ [MY_LEADS] Error in getMyLeads:", error)
    return {
      data: null,
      error: `An unexpected error occurred: ${error.message || 'Unknown error'}`,
    }
  }
}

// Get lead statistics for current user
export async function getMyLeadStats() {
  try {
    console.log("📊 [MY_LEADS] Fetching current user's lead statistics via PostgreSQL...")

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.email) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Find the employee record
    const employeeResult = await query(`
      SELECT id FROM employees WHERE email = $1 AND status = 'active'
    `, [currentUser.email])

    if (employeeResult.rows.length === 0) {
      return {
        success: false,
        error: "Employee record not found",
      }
    }

    const employee = employeeResult.rows[0]

    // Get comprehensive lead statistics
    const statsResult = await query(`
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
        COUNT(*) FILTER (WHERE status NOT IN ('CLOSED_WON', 'CLOSED_LOST', 'REJECTED')) as active_leads,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as leads_this_week,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_this_month,
        COUNT(*) FILTER (WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day') as leads_updated_today
      FROM leads
      WHERE assigned_to = $1
    `, [employee.id])

    const stats = statsResult.rows[0] || {}

    // Convert string counts to numbers
    Object.keys(stats).forEach(key => {
      stats[key] = parseInt(stats[key]) || 0
    })

    console.log(`✅ [MY_LEADS] Generated statistics: ${stats.total_leads} total leads, ${stats.active_leads} active`)

    return {
      success: true,
      stats,
    }
  } catch (error: any) {
    console.error("❌ [MY_LEADS] Error in getMyLeadStats:", error)
    return {
      success: false,
      error: `Failed to fetch lead statistics: ${error.message || 'Unknown error'}`,
    }
  }
}

// Get recent lead activities for current user
export async function getMyRecentLeadActivities(limit = 10) {
  try {
    console.log(`📋 [MY_LEADS] Fetching recent lead activities (limit: ${limit}) via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.email) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Find the employee record
    const employeeResult = await query(`
      SELECT id FROM employees WHERE email = $1 AND status = 'active'
    `, [currentUser.email])

    if (employeeResult.rows.length === 0) {
      return {
        success: false,
        error: "Employee record not found",
      }
    }

    const employee = employeeResult.rows[0]

    // Get recent activities for leads assigned to this user
    const activitiesResult = await query(`
      SELECT 
        al.id,
        al.action,
        al.description,
        al.created_at,
        al.entity_id,
        l.lead_number,
        l.client_name
      FROM activity_logs al
      LEFT JOIN leads l ON al.entity_id = l.id::text
      WHERE al.entity_type = 'lead'
      AND l.assigned_to = $1
      ORDER BY al.created_at DESC
      LIMIT $2
    `, [employee.id, limit])

    const activities = activitiesResult.rows.map(activity => ({
      id: activity.id,
      action: activity.action,
      description: activity.description,
      created_at: activity.created_at,
      lead_number: activity.lead_number,
      client_name: activity.client_name,
    }))

    console.log(`✅ [MY_LEADS] Found ${activities.length} recent activities`)

    return {
      success: true,
      activities,
    }
  } catch (error: any) {
    console.error("❌ [MY_LEADS] Error in getMyRecentLeadActivities:", error)
    return {
      success: false,
      error: `Failed to fetch recent activities: ${error.message || 'Unknown error'}`,
    }
  }
}
