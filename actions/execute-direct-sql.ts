"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "./auth-actions"

export async function executeDirectSql(sql: string) {
  try {
    const user = await getCurrentUser()

    if (!user || user.roleName !== "Administrator") {
      return {
        success: false,
        message: "You must be an administrator to perform this action",
      }
    }

    const supabase = createClient()

    // Split the SQL into individual statements
    const statements = sql
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0)

    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.rpc("exec_sql", { sql_query: statement + ";" })

      if (error) {
        console.error("Error executing SQL statement:", error)
        console.error("Statement:", statement)
        return {
          success: false,
          message: `Error executing SQL: ${error.message}`,
        }
      }
    }

    // Revalidate all paths to clear cache
    revalidatePath("/")
    revalidatePath("/dashboard")
    revalidatePath("/admin")
    revalidatePath("/api/menu")

    return {
      success: true,
      message: "SQL executed successfully. Please reload the page to see the changes.",
    }
  } catch (error) {
    console.error("Error executing SQL:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
