"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function fixLeadSourceColumn(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // First check if the column already exists
    const { data: columnExists, error: checkError } = await supabase.rpc("column_exists", {
      table_name: "leads",
      column_name: "lead_source",
    })

    if (checkError) {
      console.error("Error checking if lead_source column exists:", checkError)
      return { success: false, message: `Error checking column: ${checkError.message}` }
    }

    if (columnExists) {
      return { success: true, message: "Lead source column already exists" }
    }

    // Add the column using the function
    const { data: addResult, error: addError } = await supabase.rpc("add_lead_source_column")

    if (addError) {
      console.error("Error adding lead_source column:", addError)

      // Try direct SQL as a fallback
      try {
        const { error: directError } = await supabase.from("leads").alter("lead_source", (col) => col.text())

        if (directError) {
          return { success: false, message: `Failed to add column: ${directError.message}` }
        }

        revalidatePath("/sales/create-lead")
        return { success: true, message: "Lead source column added successfully (direct method)" }
      } catch (directErr) {
        return { success: false, message: `All methods failed: ${directErr}` }
      }
    }

    revalidatePath("/sales/create-lead")
    return { success: true, message: "Lead source column added successfully" }
  } catch (error) {
    console.error("Error fixing lead source column:", error)
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
