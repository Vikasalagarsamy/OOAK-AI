"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Directly adds the lead_source column to the leads table using raw SQL
 * This is a last resort if other methods fail
 */
export async function addLeadSourceDirectly(): Promise<boolean> {
  try {
    const supabase = createClient()

    // Try to execute the SQL directly
    const { error } = await supabase.rpc("exec_sql", {
      sql: `ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT;`,
    })

    if (error) {
      console.error("Error adding column with direct SQL:", error)

      // Try another approach with a different client method
      const { error: queryError } = await supabase.from("_exec_sql").select(`
        sql:
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT;
      `)

      if (queryError) {
        console.error("Error with fallback method:", queryError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error adding lead_source column directly:", error)
    return false
  }
}
