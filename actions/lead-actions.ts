"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

interface AssignmentResult {
  success: boolean
  message: string
}

export async function assignLead(
  leadId: number,
  leadNumber: string,
  clientName: string,
  employeeId: number,
  employeeName: string,
): Promise<AssignmentResult> {
  const supabase = createClient()

  try {
    // Update the lead's assigned_to field
    const { error } = await supabase
      .from("leads")
      .update({
        assigned_to: employeeId,
        status: "ASSIGNED", // Ensure status is set to ASSIGNED
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId)

    if (error) {
      console.error("Error assigning lead:", error)
      return {
        success: false,
        message: `Failed to assign lead: ${error.message}`,
      }
    }

    // Log the assignment activity
    const { error: activityError } = await supabase.from("activities").insert({
      action_type: "LEAD_ASSIGNED",
      entity_type: "lead",
      entity_id: leadId,
      entity_name: leadNumber,
      description: `Lead ${leadNumber} (${clientName}) was assigned to ${employeeName}`,
      user_name: "system", // This should ideally be the current user's ID
      created_at: new Date().toISOString(),
    })

    if (activityError) {
      console.error("Error logging assignment activity:", activityError)
      // We don't fail the whole operation if just the activity logging fails
    }

    // Revalidate the unassigned leads page to reflect changes
    revalidatePath("/sales/unassigned-lead")

    return {
      success: true,
      message: `Lead successfully assigned to ${employeeName}`,
    }
  } catch (error) {
    console.error("Exception assigning lead:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
