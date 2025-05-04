"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Server action to manually add the lead_source column to the leads table
 */
export async function manuallyAddLeadSourceColumn(): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()

    // First check if the column already exists
    const { data: columnExists, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "leads")
      .eq("column_name", "lead_source")
      .maybeSingle()

    if (checkError) {
      return {
        success: false,
        message: `Error checking if column exists: ${checkError.message}`,
      }
    }

    // If column already exists, return success
    if (columnExists) {
      return { success: true, message: "Column already exists" }
    }

    // Try to execute the SQL directly through a stored procedure
    const { error } = await supabase.rpc("add_lead_source_column_direct")

    if (error) {
      return {
        success: false,
        message: `Error adding column: ${error.message}`,
      }
    }

    return { success: true, message: "Column added successfully" }
  } catch (error) {
    console.error("Error in manuallyAddLeadSourceColumn:", error)
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
