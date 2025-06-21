"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"

/**
 * UPDATE LEAD SOURCES ACTIONS - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized lead source mapping operations
 * - All Supabase dependencies eliminated
 */

/**
 * Function to update lead_source_id for leads that have
 * lead_source text but are missing the corresponding ID
 */
export async function updateMissingLeadSourceIds(): Promise<{
  success: boolean
  message: string
  updatedLeads?: string[]
}> {
  try {
    console.log('🔍 Finding leads with missing lead source IDs via PostgreSQL...')
    
    // Step 1: Get all leads with lead_source but without lead_source_id
    const leadsResult = await query(`
      SELECT id, lead_number, lead_source 
      FROM leads 
      WHERE lead_source IS NOT NULL 
      AND lead_source_id IS NULL
    `)

    if (leadsResult.rows.length === 0) {
      console.log('✅ No leads with missing lead source IDs found')
      return {
        success: true,
        message: "No leads with missing lead source IDs found.",
        updatedLeads: [],
      }
    }

    const leadsWithMissingIds = leadsResult.rows
    console.log(`📊 Found ${leadsWithMissingIds.length} leads with missing lead source IDs`)

    // Step 2: Get all lead sources
    const sourcesResult = await query('SELECT id, name FROM lead_sources')

    if (sourcesResult.rows.length === 0) {
      console.error('❌ No lead sources found in database')
      return {
        success: false,
        message: "No lead sources found in the database.",
      }
    }

    const leadSources = sourcesResult.rows
    console.log(`📋 Found ${leadSources.length} lead sources for mapping`)

    // Create a map of lead source names to IDs (case insensitive)
    const sourceMap = new Map(leadSources.map((source) => [source.name.toLowerCase(), source.id]))

    // Step 3: Update each lead with the correct source ID
    const updatedLeadNumbers: string[] = []
    let failures = 0

    for (const lead of leadsWithMissingIds) {
      if (!lead.lead_source) continue

      const sourceId = sourceMap.get(lead.lead_source.toLowerCase())

      if (sourceId) {
        try {
          await query(
            'UPDATE leads SET lead_source_id = $1 WHERE id = $2',
            [sourceId, lead.id]
          )

          updatedLeadNumbers.push(lead.lead_number)
          console.log(`✅ Updated lead ${lead.lead_number}: ${lead.lead_source} → ID ${sourceId}`)

          // Log the activity
          await logActivity({
            actionType: "update",
            entityType: "lead",
            entityId: lead.id.toString(),
            entityName: lead.lead_number,
            description: `Updated lead source ID for lead ${lead.lead_number} (Source: ${lead.lead_source}, ID: ${sourceId})`,
            userName: "System",
          })
        } catch (updateError) {
          console.error(`❌ Error updating lead ${lead.lead_number}:`, updateError)
          failures++
        }
      } else {
        console.warn(`⚠️ No matching lead source found for "${lead.lead_source}" in lead ${lead.lead_number}`)
        failures++
      }
    }

    // Step 4: Return the results
    if (failures === 0 && updatedLeadNumbers.length > 0) {
      revalidatePath("/sales/manage-lead")
      revalidatePath("/sales/my-leads")
      revalidatePath("/sales/unassigned-lead")

      console.log(`🎉 Successfully updated lead source IDs for ${updatedLeadNumbers.length} leads`)
      return {
        success: true,
        message: `Successfully updated lead source IDs for ${updatedLeadNumbers.length} leads.`,
        updatedLeads: updatedLeadNumbers,
      }
    } else if (failures > 0 && updatedLeadNumbers.length > 0) {
      console.log(`⚠️ Partially successful: Updated ${updatedLeadNumbers.length} leads, failed ${failures}`)
      return {
        success: true,
        message: `Partially successful: Updated ${updatedLeadNumbers.length} leads, failed to update ${failures} leads.`,
        updatedLeads: updatedLeadNumbers,
      }
    } else {
      console.error(`❌ Failed to update any lead source IDs. ${failures} leads could not be matched`)
      return {
        success: false,
        message: `Failed to update any lead source IDs. ${failures} leads could not be matched with sources.`,
        updatedLeads: [],
      }
    }
  } catch (error) {
    console.error("❌ Error updating lead source IDs:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
