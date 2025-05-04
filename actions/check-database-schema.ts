"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Checks if the lead_source column exists in the leads table
 * @returns Object with column existence status and details
 */
export async function checkLeadSourceColumnExists(): Promise<{
  exists: boolean
  details?: any
  allColumns?: any[]
  error?: string
}> {
  try {
    const supabase = createClient()

    // Check if lead_source column exists
    const { data, error } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "leads")
      .eq("column_name", "lead_source")

    if (error) {
      return {
        exists: false,
        error: `Error checking schema: ${error.message}`,
      }
    }

    // Get all columns for reference
    const { data: allColumns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type")
      .eq("table_name", "leads")
      .order("ordinal_position")

    if (columnsError) {
      console.error("Error fetching all columns:", columnsError)
    }

    return {
      exists: data && data.length > 0,
      details: data && data.length > 0 ? data[0] : undefined,
      allColumns: allColumns || [],
      error: undefined,
    }
  } catch (error) {
    console.error("Unexpected error checking schema:", error)
    return {
      exists: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
