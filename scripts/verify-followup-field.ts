#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { program } from "commander"

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function verifyFollowupField(leadId: number): Promise<void> {
  console.log(`Verifying follow-up field name change with lead ID: ${leadId}...`)

  try {
    // 1. Validate that the lead exists
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, lead_number, client_name")
      .eq("id", leadId)
      .single()

    if (leadError || !lead) {
      console.error("Lead not found:", leadError?.message || "No lead with this ID")
      process.exit(1)
    }

    console.log(`Found lead: ${lead.lead_number} - ${lead.client_name}`)

    // 2. Create a test follow-up using the updated field name
    const testFollowup = {
      lead_id: leadId,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      followup_type: "phone",
      notes: "Test follow-up for field name verification (CLI)",
      priority: "medium",
      interaction_summary: "CLI verification of field name change",
      status: "scheduled",
    }

    console.log("Attempting to insert follow-up with updated field name...")

    // 3. Insert the test follow-up
    const { data: insertedFollowup, error: insertError } = await supabase
      .from("lead_followups")
      .insert(testFollowup)
      .select()

    if (insertError) {
      console.error("Failed to insert follow-up:", insertError.message)
      process.exit(1)
    }

    console.log("Successfully inserted follow-up with ID:", insertedFollowup[0].id)

    // 4. Fetch the inserted follow-up to verify it was saved correctly
    const { data: fetchedFollowup, error: fetchError } = await supabase
      .from("lead_followups")
      .select("*")
      .eq("id", insertedFollowup[0].id)
      .single()

    if (fetchError) {
      console.error("Failed to fetch the inserted follow-up:", fetchError.message)
      process.exit(1)
    }

    // 5. Verify that the field name is correct in the stored data
    const hasCorrectFieldName = "followup_type" in fetchedFollowup
    const fieldNameValue = fetchedFollowup.followup_type

    if (hasCorrectFieldName) {
      console.log(`✅ VERIFICATION SUCCESSFUL: Follow-up was created with followup_type = "${fieldNameValue}"`)
    } else {
      console.error("❌ VERIFICATION FAILED: followup_type field not found in stored data")
      console.log("Stored follow-up data:", fetchedFollowup)
    }

    // 6. Clean up the test data
    console.log("Cleaning up test data...")
    const { error: deleteError } = await supabase.from("lead_followups").delete().eq("id", insertedFollowup[0].id)

    if (deleteError) {
      console.warn("Warning: Failed to clean up test data:", deleteError.message)
    } else {
      console.log("Test data successfully cleaned up")
    }

    // Done
    if (hasCorrectFieldName) {
      console.log("\n🎉 Field name change verification complete. The system is working correctly!")
    } else {
      console.log("\n❌ Field name change verification failed. Please check your code changes.")
      process.exit(1)
    }
  } catch (error) {
    console.error("Error during verification:", error)
    process.exit(1)
  }
}

// Set up command line interface
program
  .description("Verify follow-up field name change from contact_method to followup_type")
  .requiredOption("-l, --lead-id <id>", "Lead ID to use for testing", Number.parseInt)
  .action(async (options) => {
    await verifyFollowupField(options.leadId)
  })

program.parse()
