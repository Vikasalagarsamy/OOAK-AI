"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function verifyFollowupField(leadId: number) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Check if the lead exists
    const { data: leadData, error: leadError } = await supabase.from("leads").select("id").eq("id", leadId).single()

    if (leadError || !leadData) {
      return {
        success: false,
        message: "Lead not found",
        details: leadError?.message,
      }
    }

    // Create a test follow-up with the new field name
    const { data, error } = await supabase
      .from("lead_followups")
      .insert({
        lead_id: leadId,
        followup_type: "phone", // Using the new field name
        scheduled_date: new Date().toISOString(),
        notes: "Test verification of field name change",
        status: "pending",
        is_test: true, // Mark as test for easy cleanup
      })
      .select()

    if (error) {
      return {
        success: false,
        message: "Failed to create test follow-up",
        details: error.message,
      }
    }

    // Verify the follow-up was created with the correct field
    const { data: verifyData, error: verifyError } = await supabase
      .from("lead_followups")
      .select("*")
      .eq("is_test", true)
      .order("created_at", { ascending: false })
      .limit(1)

    if (verifyError) {
      return {
        success: false,
        message: "Failed to verify follow-up",
        details: verifyError.message,
      }
    }

    // Check if the followup_type field exists and has the correct value
    const testRecord = verifyData?.[0]
    if (!testRecord) {
      return {
        success: false,
        message: "Test record not found",
      }
    }

    const hasCorrectField = "followup_type" in testRecord
    const fieldValue = testRecord.followup_type

    // Clean up the test record
    await supabase.from("lead_followups").delete().eq("id", testRecord.id)

    if (hasCorrectField && fieldValue === "phone") {
      return {
        success: true,
        message: "Verification successful! The field name has been updated correctly.",
        details: `Created follow-up with ID ${testRecord.id} and followup_type "${fieldValue}"`,
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
    return {
      success: false,
      message: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}
