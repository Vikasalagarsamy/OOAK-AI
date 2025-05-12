"use server"

import { createClient } from "@/lib/supabase/server"
import type { FollowUpType, Priority } from "@/types/follow-up"
import { getCurrentUser } from "@/lib/auth-utils"

/**
 * Test function to verify that follow-ups can be scheduled with the updated field name
 */
export async function testFollowupScheduling(
  leadId: number,
): Promise<{ success: boolean; message: string; data?: any; error?: any }> {
  const supabase = createClient()

  try {
    // 1. First validate that the user is authenticated
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.id) {
      return { success: false, message: "Authentication required for test" }
    }

    // 2. Validate that the lead exists
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      return {
        success: false,
        message: "Lead not found for testing",
        error: leadError,
      }
    }

    // 3. Create a test follow-up using the updated field name
    const testFollowup = {
      lead_id: leadId,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      followup_type: "phone" as FollowUpType,
      notes: "Test follow-up for field name verification",
      priority: "medium" as Priority,
      interaction_summary: "Verifying field name change from contact_method to followup_type",
      status: "scheduled",
    }

    // 4. Insert the test follow-up
    const { data: insertedFollowup, error: insertError } = await supabase
      .from("lead_followups")
      .insert(testFollowup)
      .select()

    if (insertError) {
      return {
        success: false,
        message: "Failed to insert follow-up with updated field name",
        error: insertError,
      }
    }

    // 5. Fetch the inserted follow-up to verify it was saved correctly
    const { data: fetchedFollowup, error: fetchError } = await supabase
      .from("lead_followups")
      .select("*")
      .eq("id", insertedFollowup[0].id)
      .single()

    if (fetchError) {
      return {
        success: false,
        message: "Failed to fetch the inserted follow-up",
        error: fetchError,
      }
    }

    // 6. Clean up the test data (optional - comment out if you want to keep the test data)
    const { error: deleteError } = await supabase.from("lead_followups").delete().eq("id", insertedFollowup[0].id)

    if (deleteError) {
      console.warn("Warning: Failed to clean up test data", deleteError)
    }

    // 7. Verify that the field name is correct in the stored data
    const hasCorrectFieldName = "followup_type" in fetchedFollowup
    const fieldNameValue = fetchedFollowup.followup_type

    return {
      success: hasCorrectFieldName,
      message: hasCorrectFieldName
        ? `Verification successful: Follow-up created with followup_type = ${fieldNameValue}`
        : "Verification failed: followup_type field not found in stored data",
      data: {
        inserted: insertedFollowup[0],
        fetched: fetchedFollowup,
        fieldExists: hasCorrectFieldName,
        fieldValue: fieldNameValue,
      },
    }
  } catch (error) {
    console.error("Error during follow-up scheduling verification:", error)
    return {
      success: false,
      message: "Unexpected error during verification",
      error,
    }
  }
}
