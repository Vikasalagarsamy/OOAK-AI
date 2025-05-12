"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import fs from "fs"
import path from "path"

export async function createEventsTable() {
  const supabase = createClient(cookies())

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "sql", "create-events-table.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error creating events table:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating events table:", error)
    return { success: false, error: String(error) }
  }
}
