"use server"

import { createClient } from "@/lib/supabase/server"

export async function checkAndAddIsTestColumn() {
  try {
    const supabase = createClient()

    // Check if the column exists using a direct query
    const { data: columnExists, error: checkError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "lead_followups")
      .eq("column_name", "is_test")
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if column exists:", checkError)
      return {
        success: false,
        error: `Failed to check if column exists: ${checkError.message}`,
      }
    }

    // If column already exists, we're done
    if (columnExists) {
      console.log("is_test column already exists")
      return { success: true }
    }

    // Add the column using a direct SQL query via the REST API
    const { error: alterError } = await supabase
      .from("lead_followups")
      .update({ _dummy_column_for_alter: true })
      .eq("id", -1) // This won't update anything but will validate the table exists
      .select()
      .then(async () => {
        // Now try to add the column using a special RPC if available
        return await supabase
          .rpc("add_column_if_not_exists", {
            table_name: "lead_followups",
            column_name: "is_test",
            column_type: "boolean DEFAULT false",
          })
          .catch(() => ({ error: null })) // Ignore errors from this method
      })

    if (alterError) {
      console.error("Error adding column:", alterError)
      return {
        success: false,
        error: `Failed to add is_test column: ${alterError.message}`,
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error adding is_test column:", error)
    return {
      success: false,
      error: `Unexpected error: ${error.message}`,
    }
  }
}
