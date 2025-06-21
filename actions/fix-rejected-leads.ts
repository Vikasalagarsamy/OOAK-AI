"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"

export async function fixRejectedLeads(): Promise<{
  success: boolean
  message: string
  fixedLeads?: number[]
}> {
  try {
    console.log("🔧 [REJECTED_LEADS] Starting rejected leads fix via PostgreSQL...")

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Find all leads that are rejected but have null rejection fields
    console.log("🔍 [REJECTED_LEADS] Finding rejected leads with missing rejection details...")
    const rejectedLeadsResult = await query(`
      SELECT id, lead_number, client_name, status, rejection_reason, rejected_at, rejected_by
      FROM leads 
      WHERE status = 'REJECTED' 
      AND rejection_reason IS NULL
      ORDER BY updated_at DESC
    `)

    const rejectedLeads = rejectedLeadsResult.rows

    if (!rejectedLeads || rejectedLeads.length === 0) {
      console.log("✅ [REJECTED_LEADS] No rejected leads found with missing rejection details")
      return { 
        success: true, 
        message: "No rejected leads found with missing rejection details", 
        fixedLeads: [] 
      }
    }

    console.log(`📊 [REJECTED_LEADS] Found ${rejectedLeads.length} rejected leads to fix`)

    // Fix each rejected lead using a transaction
    const result = await transaction(async (client) => {
      const fixedLeads: number[] = []
      const errors: string[] = []

      for (const lead of rejectedLeads) {
        try {
          const updateResult = await client.query(`
            UPDATE leads 
            SET 
              rejection_reason = $1,
              rejected_at = $2,
              rejected_by = $3,
              updated_at = $4
            WHERE id = $5
            RETURNING id
          `, [
            "Auto-fixed: No reason provided",
            new Date().toISOString(),
            parseInt(currentUser.id),
            new Date().toISOString(),
            lead.id
          ])

          if (updateResult.rowCount && updateResult.rowCount > 0) {
            fixedLeads.push(lead.id)
            console.log(`✅ [REJECTED_LEADS] Fixed lead ${lead.lead_number} (ID: ${lead.id})`)
          }
        } catch (updateError: any) {
          console.error(`❌ [REJECTED_LEADS] Error fixing lead ${lead.id}:`, updateError)
          errors.push(`Failed to fix lead ${lead.lead_number}: ${updateError.message}`)
        }
      }

      return { fixedLeads, errors }
    })

    // Revalidate paths
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/manage-lead")

    console.log(`🎉 [REJECTED_LEADS] Fixed ${result.fixedLeads.length} leads with ${result.errors.length} errors`)

    if (result.errors.length > 0) {
      return {
        success: true,
        message: `Fixed ${result.fixedLeads.length} leads with ${result.errors.length} errors: ${result.errors.join("; ")}`,
        fixedLeads: result.fixedLeads,
      }
    }

    return {
      success: true,
      message: `Successfully fixed ${result.fixedLeads.length} rejected leads`,
      fixedLeads: result.fixedLeads,
    }
  } catch (error: any) {
    console.error("❌ [REJECTED_LEADS] Error fixing rejected leads:", error)
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error.message || "Unknown error"}` 
    }
  }
}

export async function fixSpecificRejectedLead(leadId: number): Promise<{
  success: boolean
  message: string
}> {
  try {
    console.log(`🔧 [REJECTED_LEADS] Starting fix for specific lead ${leadId} via PostgreSQL...`)

    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    // Get the lead to check if it's rejected
    console.log(`🔍 [REJECTED_LEADS] Fetching lead ${leadId} details...`)
    const leadResult = await query(`
      SELECT id, lead_number, client_name, status, rejection_reason, rejected_at, rejected_by
      FROM leads 
      WHERE id = $1
    `, [leadId])

    if (leadResult.rows.length === 0) {
      return { success: false, message: "Lead not found" }
    }

    const lead = leadResult.rows[0]

    if (lead.status !== "REJECTED") {
      return { success: false, message: "Lead is not rejected" }
    }

    console.log(`📝 [REJECTED_LEADS] Fixing rejected lead ${lead.lead_number}...`)

    // Fix the rejected lead
    const updateResult = await query(`
      UPDATE leads 
      SET 
        rejection_reason = $1,
        rejected_at = $2,
        rejected_by = $3,
        updated_at = $4
      WHERE id = $5
      RETURNING id
    `, [
      lead.rejection_reason || "Auto-fixed: No reason provided",
      lead.rejected_at || new Date().toISOString(),
      lead.rejected_by || parseInt(currentUser.id),
      new Date().toISOString(),
      leadId
    ])

    if (updateResult.rowCount === 0) {
      return { success: false, message: "Failed to update lead" }
    }

    // Revalidate paths
    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/manage-lead")

    console.log(`✅ [REJECTED_LEADS] Successfully fixed rejected lead ${lead.lead_number}`)
    return { 
      success: true, 
      message: `Successfully fixed rejected lead ${lead.lead_number}` 
    }
  } catch (error: any) {
    console.error("❌ [REJECTED_LEADS] Error fixing rejected lead:", error)
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error.message || "Unknown error"}` 
    }
  }
}
