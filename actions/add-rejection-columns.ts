"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addRejectionColumnsToLeads(): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()

    // Check if columns already exist
    const { data: columnsExist, error: checkError } = await supabase.rpc("column_exists", {
      table_name: "leads",
      column_name: "rejection_reason",
    })

    if (checkError) {
      console.error("Error checking if columns exist:", checkError)

      // If the RPC function doesn't exist, try a direct query
      const { data: columns, error: infoSchemaError } = await supabase
        .from("information_schema.columns")
        .select("column_name")
        .eq("table_name", "leads")
        .eq("column_name", "rejection_reason")

      if (infoSchemaError) {
        console.error("Error querying information schema:", infoSchemaError)
        // Proceed with adding columns anyway
      } else if (columns && columns.length > 0) {
        return { success: true, message: "Rejection columns already exist" }
      }
    } else if (columnsExist) {
      return { success: true, message: "Rejection columns already exist" }
    }

    // Add the columns
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql_string: `
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_by UUID;
      `,
    })

    if (alterError) {
      console.error("Error adding rejection columns:", alterError)

      // Try direct SQL execution as fallback
      const queries = [
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejection_reason TEXT",
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_by UUID",
      ]

      for (const query of queries) {
        const { error } = await supabase.rpc("exec_sql", { sql_string: query })
        if (error) {
          console.error(`Error executing SQL: ${query}`, error)
        }
      }
    }

    // Revalidate paths
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/my-leads")

    return { success: true, message: "Rejection columns added successfully" }
  } catch (error) {
    console.error("Error adding rejection columns:", error)
    return { success: false, message: "Failed to add rejection columns" }
  }
}
