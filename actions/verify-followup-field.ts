"use server"

import { getSupabaseServer } from "@/lib/supabase-client"
import { addIsTestColumnToFollowups } from "./add-is-test-column"

export async function verifyFollowupField(leadId: number) {
  try {
    const supabase = getSupabaseServer()

    // Check if the lead exists
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .select("id, client_name")
      .eq("id", leadId)
      .single()

    if (leadError) {
      return {
        success: false,
        message: "Failed to find lead",
        details: leadError.message,
      }
    }

    if (!leadData) {
      return {
        success: false,
        message: "Lead not found",
        details: `No lead found with ID ${leadId}`,
      }
    }

    // Ensure the is_test column exists
    const columnResult = await addIsTestColumnToFollowups()
    if (!columnResult.success) {
      return {
        success: false,
        message: "Failed to prepare database",
        details: columnResult.error || "Could not add is_test column",
      }
    }

    // Create a test follow-up with the new field name
    const testData = {
      lead_id: leadId,
      followup_type: "phone", // Using the new field name
      scheduled_at: new Date().toISOString(),
      notes: "Test verification of field name change",
      priority: "medium",
      is_test: true, // Mark as test for easy cleanup
    }

    const { data: insertData, error: insertError } = await supabase.from("lead_followups").insert(testData).select()

    if (insertError) {
      // Check if the error is related to the field name
      if (insertError.message.includes("contact_method")) {
        return {
          success: false,
          message: "Field name has not been updated in the database",
          details: "The database is still expecting 'contact_method' instead of 'followup_type'",
        }
      }

      // Check if the error is related to the is_test column
      if (insertError.message.includes("is_test")) {
        return {
          success: false,
          message: "Failed to add is_test column properly",
          details: insertError.message,
        }
      }

      return {
        success: false,
        message: "Failed to create test follow-up",
        details: insertError.message,
      }
    }

    // Get the inserted record ID
    const insertedId = insertData?.[0]?.id
    if (!insertedId) {
      return {
        success: false,
        message: "Failed to retrieve inserted record ID",
        details: "The record was inserted but no ID was returned",
      }
    }

    // Verify the follow-up was created with the correct field
    const { data: verifyData, error: verifyError } = await supabase
      .from("lead_followups")
      .select("*")
      .eq("id", insertedId)
      .single()

    // Clean up the test record regardless of verification result
    await supabase.from("lead_followups").delete().eq("id", insertedId)

    if (verifyError) {
      return {
        success: false,
        message: "Failed to verify follow-up",
        details: verifyError.message,
      }
    }

    // Check if the followup_type field exists and has the correct value
    const hasCorrectField = "followup_type" in verifyData
    const fieldValue = verifyData.followup_type

    if (hasCorrectField && fieldValue === "phone") {
      return {
        success: true,
        message: "Verification successful! The field name has been updated correctly.",
        details: `Created follow-up for lead "${leadData.client_name}" with followup_type "${fieldValue}"`,
      }
    } else {
      return {
        success: false,
        message: "Verification failed. The field name may not be updated correctly.",
        details: hasCorrectField
          ? `Field exists but has unexpected value: "${fieldValue}"`
          : "Field 'followup_type' not found in the record",
      }
    }
  } catch (error) {
    console.error("Unexpected error in verifyFollowupField:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
