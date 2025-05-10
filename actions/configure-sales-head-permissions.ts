"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

export async function configureSalesHeadPermissions() {
  try {
    const supabase = createClient()

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "sql", "configure-sales-head-permissions.sql")
    let sqlContent: string

    try {
      sqlContent = fs.readFileSync(sqlFilePath, "utf8")
    } catch (readError) {
      console.error("Error reading SQL file:", readError)
      return {
        success: false,
        error: "Could not read SQL file. Please ensure the file exists and is accessible.",
      }
    }

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sqlContent })

    if (error) {
      console.error("Error executing SQL:", error)
      return {
        success: false,
        error: `Failed to configure Sales Head permissions: ${error.message}`,
      }
    }

    // Revalidate relevant paths
    revalidatePath("/admin/role-permissions")
    revalidatePath("/admin/test-rbac")

    return {
      success: true,
      message: "Sales Head permissions configured successfully",
    }
  } catch (error: any) {
    console.error("Error in configureSalesHeadPermissions:", error)
    return {
      success: false,
      error: `An unexpected error occurred: ${error.message}`,
    }
  }
}
