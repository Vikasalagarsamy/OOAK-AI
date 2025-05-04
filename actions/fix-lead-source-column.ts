"use server"

import { createClient } from "@/lib/supabase/server"

export async function addLeadSourceColumn(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // First check if the column already exists
    const { data: columnExists, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", "leads")
      .or("column_name.eq.lead_source,column_name.eq.lead_source_id")

    if (checkError) {
      console.error("Error checking column existence:", checkError)
      return {
        success: false,
        message: `Error checking column existence: ${checkError.message}`,
      }
    }

    // If column already exists, return success
    if (columnExists && columnExists.length > 0) {
      return {
        success: true,
        message: `Column ${columnExists[0].column_name} already exists`,
      }
    }

    // Add the lead_source column
    const { error: alterError } = await supabase.rpc("execute_sql", {
      sql: "ALTER TABLE leads ADD COLUMN lead_source TEXT",
    })

    if (alterError) {
      // Try direct SQL if RPC fails
      const { error: directError } = await supabase.rpc("execute_sql", {
        sql: "ALTER TABLE public.leads ADD COLUMN lead_source TEXT",
      })

      if (directError) {
        console.error("Error adding lead_source column:", directError)
        return {
          success: false,
          message: `Error adding lead_source column: ${directError.message}`,
        }
      }
    }

    return {
      success: true,
      message: "Successfully added lead_source column to leads table",
    }
  } catch (error) {
    console.error("Exception in addLeadSourceColumn:", error)
    return {
      success: false,
      message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
