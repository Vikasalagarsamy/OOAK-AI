"use server"

import { createClient } from "@/lib/supabase/server"

export async function executeSql(sql: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error executing SQL:", error)
      return { success: false, message: `SQL execution failed: ${error.message}` }
    }

    return { success: true, message: "SQL executed successfully" }
  } catch (error) {
    console.error("Unexpected error executing SQL:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
