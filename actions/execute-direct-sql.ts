"use server"

import { createClient } from "@/lib/supabase/server"

export async function executeDirectSQL(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // Try a simpler approach with direct SQL
    const { data, error } = await supabase.auth.admin.createUser({
      email: "temp@example.com",
      password: "tempPassword123",
      email_confirm: true,
    })

    if (error) {
      console.error("Error creating temp user:", error)
      return { success: false, message: `Failed to create temp user: ${error.message}` }
    }

    // Use the PostgreSQL connection directly
    const { error: sqlError } = await supabase
      .from("lead_followups")
      .update({ created_by: "system" })
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .select()

    if (sqlError) {
      console.error("Error executing SQL:", sqlError)
      return { success: false, message: `Failed to execute SQL: ${sqlError.message}` }
    }

    return { success: true, message: "SQL executed successfully" }
  } catch (error) {
    console.error("Error executing SQL:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
