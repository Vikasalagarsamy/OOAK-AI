"use server"

import { createClient } from "@/utils/supabase/server"

export async function addLeadSourcesDefaultConstraint(): Promise<{
  success: boolean
  message: string
}> {
  try {
    const supabase = createClient()

    // Execute the SQL to add the default constraint
    const { error } = await supabase.rpc("add_lead_sources_default_constraint")

    if (error) {
      // If the RPC doesn't exist, try direct SQL
      const { error: sqlError } = await supabase
        .from("lead_sources")
        .select("id")
        .limit(1)
        .then(async () => {
          // Table exists, try to add the constraint
          return await supabase.rpc("exec_sql", {
            sql_query: "ALTER TABLE lead_sources ALTER COLUMN is_active SET DEFAULT true;",
          })
        })
        .catch((err) => {
          console.error("Error checking lead_sources table:", err)
          return { error: err }
        })

      if (sqlError) {
        console.error("Error adding default constraint:", sqlError)
        return {
          success: false,
          message: `Failed to add default constraint: ${sqlError.message}`,
        }
      }
    }

    return {
      success: true,
      message: "Default constraint added successfully to is_active column",
    }
  } catch (error) {
    console.error("Error adding default constraint:", error)
    return {
      success: false,
      message: `Failed to add default constraint: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
