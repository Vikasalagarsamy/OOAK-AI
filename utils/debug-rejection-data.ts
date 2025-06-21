"use server"

import { query, transaction } from "@/lib/postgresql-client"

/**
 * DEBUG REJECTION DATA - NOW 100% POSTGRESQL
 * ==========================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized rejection data analysis
 * - All Supabase dependencies eliminated
 */

/**
 * Debug utility to check rejection data for a specific lead
 */
export async function debugLeadRejectionData(leadId: number) {
  try {
    console.log(`🐛 Debugging lead rejection data for lead ID: ${leadId} via PostgreSQL...`)

    // Get lead data via PostgreSQL
    const leadResult = await query(`
      SELECT * 
      FROM leads 
      WHERE id = $1
    `, [leadId])

    if (leadResult.rows.length === 0) {
      console.error(`❌ Lead not found: ${leadId}`)
      return { success: false, message: 'Lead not found' }
    }

    const lead = leadResult.rows[0]

    // Get rejection activities via PostgreSQL with enhanced filtering
    const activitiesResult = await query(`
      SELECT * 
      FROM activities 
      WHERE entity_id = $1
        AND action_type = 'reject'
        AND entity_type = 'lead'
      ORDER BY created_at DESC
    `, [leadId.toString()])

    const activities = activitiesResult.rows

    console.log(`✅ Found ${activities.length} rejection activities for lead ${leadId}`)

    return {
      success: true,
      lead,
      activities,
      analysis: {
        hasRejectionReason: Boolean(lead.rejection_reason),
        hasRejectedAt: Boolean(lead.rejected_at),
        hasRejectedBy: Boolean(lead.rejected_by),
        activityCount: activities.length,
        mostRecentActivity: activities[0] || null,
        isDataConsistent: Boolean(
          lead.rejection_reason && 
          lead.rejected_at && 
          lead.rejected_by && 
          activities.length > 0
        )
      },
    }

  } catch (error: any) {
    console.error(`❌ Error in debugLeadRejectionData for lead ${leadId} via PostgreSQL:`, error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

/**
 * Fix a specific lead's rejection data by syncing it with the most recent rejection activity
 */
export async function syncLeadRejectionData(leadId: number) {
  try {
    console.log(`🔄 Syncing lead rejection data for lead ID: ${leadId} via PostgreSQL...`)

    // Get the most recent rejection activity via PostgreSQL
    const activityResult = await query(`
      SELECT * 
      FROM activities 
      WHERE entity_id = $1
        AND action_type = 'reject'
        AND entity_type = 'lead'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [leadId.toString()])

    if (activityResult.rows.length === 0) {
      console.error(`❌ No rejection activity found for lead: ${leadId}`)
      return { success: false, message: 'No rejection activity found' }
    }

    const activity = activityResult.rows[0]

    // Extract rejection reason from description
    let rejectionReason = "No reason provided"
    if (activity.description && activity.description.includes("Reason:")) {
      rejectionReason = activity.description.split("Reason:")[1].trim()
    } else if (activity.description) {
      rejectionReason = activity.description.trim()
    }

    // Update the lead with the correct rejection data via PostgreSQL transaction
    const updateResult = await transaction(async (client) => {
      const result = await client.query(`
        UPDATE leads 
        SET 
          rejection_reason = $1,
          rejected_at = $2,
          rejected_by = $3,
          status = 'REJECTED',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [rejectionReason, activity.created_at, activity.user_id, leadId])

      return result.rows[0]
    })

    console.log(`✅ Lead rejection data synchronized successfully for lead ${leadId}`)

    return {
      success: true,
      message: "Lead rejection data synchronized successfully",
      rejectionReason,
      rejectedAt: activity.created_at,
      rejectedBy: activity.user_id,
      updatedLead: updateResult
    }

  } catch (error: any) {
    console.error(`❌ Error in syncLeadRejectionData for lead ${leadId} via PostgreSQL:`, error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}

/**
 * Mass sync all leads with inconsistent rejection data
 */
export async function massFixRejectionData() {
  try {
    console.log('🔄 Starting mass fix of rejection data via PostgreSQL...')

    // Find leads with rejection activities but missing rejection data
    const problematicLeadsResult = await query(`
      SELECT DISTINCT 
        l.id,
        l.lead_number,
        l.rejection_reason,
        l.rejected_at,
        l.rejected_by
      FROM leads l
      INNER JOIN activities a ON l.id::text = a.entity_id
      WHERE a.action_type = 'reject'
        AND a.entity_type = 'lead'
        AND (
          l.rejection_reason IS NULL 
          OR l.rejected_at IS NULL 
          OR l.rejected_by IS NULL
        )
      ORDER BY l.id
    `)

    const problematicLeads = problematicLeadsResult.rows
    console.log(`🔍 Found ${problematicLeads.length} leads with inconsistent rejection data`)

    const results = []
    for (const lead of problematicLeads) {
      const syncResult = await syncLeadRejectionData(lead.id)
      results.push({
        leadId: lead.id,
        leadNumber: lead.lead_number,
        ...syncResult
      })
    }

    const successCount = results.filter(r => r.success).length
    console.log(`✅ Successfully fixed ${successCount}/${problematicLeads.length} leads`)

    return {
      success: true,
      message: `Fixed ${successCount} out of ${problematicLeads.length} leads`,
      results
    }

  } catch (error: any) {
    console.error('❌ Error in massFixRejectionData via PostgreSQL:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}
