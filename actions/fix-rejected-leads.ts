"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth-utils"

export async function fixRejectedLeads(): Promise<{
  success: boolean
  message: string
  fixedLeads?: number[]
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    const supabase = createClient()

    // Find all leads that are rejected but have null rejection fields
    const { data: rejectedLeads, error: fetchError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name, status, rejection_reason, rejected_at, rejected_by")
      .eq("status", "REJECTED")
      .is("rejection_reason", null)

    if (fetchError) {
      console.error("Error fetching rejected leads:", fetchError)
      return { success: false, message: "Failed to fetch rejected leads" }
    }

    if (!rejectedLeads || rejectedLeads.length === 0) {
      return { success: true, message: "No rejected leads found with missing rejection details", fixedLeads: [] }
    }

    // Fix each rejected lead
    const fixedLeads: number[] = []
    const errors: string[] = []

    for (const lead of rejectedLeads) {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          rejection_reason: "Auto-fixed: No reason provided",
          rejected_at: new Date().toISOString(),
          rejected_by: currentUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id)

      if (updateError) {
        console.error(`Error fixing lead ${lead.id}:`, updateError)
        errors.push(`Failed to fix lead ${lead.lead_number}: ${updateError.message}`)
      } else {
        fixedLeads.push(lead.id)
      }
    }

    // Revalidate paths
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/manage-lead")

    if (errors.length > 0) {
      return {
        success: true,
        message: `Fixed ${fixedLeads.length} leads with ${errors.length} errors: ${errors.join("; ")}`,
        fixedLeads,
      }
    }

    return {
      success: true,
      message: `Successfully fixed ${fixedLeads.length} rejected leads`,
      fixedLeads,
    }
  } catch (error) {
    console.error("Error fixing rejected leads:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}

export async function fixSpecificRejectedLead(leadId: number): Promise<{
  success: boolean
  message: string
}> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required" }
    }

    const supabase = createClient()

    // Get the lead to check if it's rejected
    const { data: lead, error: fetchError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name, status, rejection_reason, rejected_at, rejected_by")
      .eq("id", leadId)
      .single()

    if (fetchError) {
      console.error("Error fetching lead:", fetchError)
      return { success: false, message: "Failed to fetch lead details" }
    }

    if (!lead) {
      return { success: false, message: "Lead not found" }
    }

    if (lead.status !== "REJECTED") {
      return { success: false, message: "Lead is not rejected" }
    }

    // Fix the rejected lead
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        rejection_reason: lead.rejection_reason || "Auto-fixed: No reason provided",
        rejected_at: lead.rejected_at || new Date().toISOString(),
        rejected_by: lead.rejected_by || currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (updateError) {
      console.error(`Error fixing lead ${leadId}:`, updateError)
      return { success: false, message: `Failed to fix lead: ${updateError.message}` }
    }

    // Revalidate paths
    revalidatePath(`/sales/lead/${leadId}`)
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/manage-lead")

    return { success: true, message: `Successfully fixed rejected lead ${lead.lead_number}` }
  } catch (error) {
    console.error("Error fixing rejected lead:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
