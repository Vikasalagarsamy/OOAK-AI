"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"

/**
 * Function to update lead_source_id for leads that have
 * lead_source text but are missing the corresponding ID
 */
export async function updateMissingLeadSourceIds(): Promise<{
  success: boolean
  message: string
  updatedLeads?: string[]
}> {
  const supabase = createClient()

  try {
    // Step 1: Get all leads with lead_source but without lead_source_id
    const { data: leadsWithMissingIds, error: findError } = await supabase
      .from("leads")
      .select("id, lead_number, lead_source")
      .not("lead_source", "is", null)
      .is("lead_source_id", null)

    if (findError) {
      console.error("Error finding leads with missing source IDs:", findError)
      return {
        success: false,
        message: `Error finding leads with missing source IDs: ${findError.message}`,
      }
    }

    if (!leadsWithMissingIds || leadsWithMissingIds.length === 0) {
      return {
        success: true,
        message: "No leads with missing lead source IDs found.",
        updatedLeads: [],
      }
    }

    console.log(`Found ${leadsWithMissingIds.length} leads with missing lead source IDs`)

    // Step 2: Get all lead sources
    const { data: leadSources, error: sourcesError } = await supabase.from("lead_sources").select("id, name")

    if (sourcesError) {
      console.error("Error fetching lead sources:", sourcesError)
      return {
        success: false,
        message: `Error fetching lead sources: ${sourcesError.message}`,
      }
    }

    if (!leadSources || leadSources.length === 0) {
      return {
        success: false,
        message: "No lead sources found in the database.",
      }
    }

    // Create a map of lead source names to IDs (case insensitive)
    const sourceMap = new Map(leadSources.map((source) => [source.name.toLowerCase(), source.id]))

    // Step 3: Update each lead with the correct source ID
    const updatedLeadNumbers: string[] = []
    let failures = 0

    for (const lead of leadsWithMissingIds) {
      if (!lead.lead_source) continue

      const sourceId = sourceMap.get(lead.lead_source.toLowerCase())

      if (sourceId) {
        const { error: updateError } = await supabase
          .from("leads")
          .update({ lead_source_id: sourceId })
          .eq("id", lead.id)

        if (updateError) {
          console.error(`Error updating lead ${lead.lead_number}:`, updateError)
          failures++
        } else {
          updatedLeadNumbers.push(lead.lead_number)

          // Log the activity
          await logActivity({
            actionType: "update",
            entityType: "lead",
            entityId: lead.id.toString(),
            entityName: lead.lead_number,
            description: `Updated lead source ID for lead ${lead.lead_number} (Source: ${lead.lead_source}, ID: ${sourceId})`,
            userName: "System",
          })
        }
      } else {
        console.warn(`No matching lead source found for "${lead.lead_source}" in lead ${lead.lead_number}`)
        failures++
      }
    }

    // Step 4: Return the results
    if (failures === 0 && updatedLeadNumbers.length > 0) {
      revalidatePath("/sales/manage-lead")
      revalidatePath("/sales/my-leads")
      revalidatePath("/sales/unassigned-lead")

      return {
        success: true,
        message: `Successfully updated lead source IDs for ${updatedLeadNumbers.length} leads.`,
        updatedLeads: updatedLeadNumbers,
      }
    } else if (failures > 0 && updatedLeadNumbers.length > 0) {
      return {
        success: true,
        message: `Partially successful: Updated ${updatedLeadNumbers.length} leads, failed to update ${failures} leads.`,
        updatedLeads: updatedLeadNumbers,
      }
    } else {
      return {
        success: false,
        message: `Failed to update any lead source IDs. ${failures} leads could not be matched with sources.`,
        updatedLeads: [],
      }
    }
  } catch (error) {
    console.error("Error updating lead source IDs:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
