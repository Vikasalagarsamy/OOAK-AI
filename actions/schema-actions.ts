"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Checks if the lead_source column exists in the leads table
 * and returns the column name if it exists
 */
export async function getLeadSourceColumnName(): Promise<string | null> {
  const supabase = createClient()

  try {
    // First check for lead_source (string/text column)
    const { data: columnData, error: columnError } = await supabase.rpc("column_exists", {
      table_name: "leads",
      column_name: "lead_source",
    })

    if (columnError) {
      console.error("Error checking for lead_source column:", columnError)
    }

    if (columnData) {
      console.log("Found lead_source column")
      return "lead_source"
    }

    // Then check for lead_source_id (foreign key column)
    const { data: idColumnData, error: idColumnError } = await supabase.rpc("column_exists", {
      table_name: "leads",
      column_name: "lead_source_id",
    })

    if (idColumnError) {
      console.error("Error checking for lead_source_id column:", idColumnError)
    }

    if (idColumnData) {
      console.log("Found lead_source_id column")
      return "lead_source_id"
    }

    // If neither column exists, try to create the lead_source column
    console.log("No lead source column found, attempting to create one")
    const { data: createResult, error: createError } = await supabase.rpc("add_lead_source_column")

    if (createError) {
      console.error("Error creating lead_source column:", createError)
      return null
    }

    if (createResult) {
      console.log("Successfully created lead_source column")
      return "lead_source"
    }

    return null
  } catch (error) {
    console.error("Exception in getLeadSourceColumnName:", error)
    return null
  }
}
