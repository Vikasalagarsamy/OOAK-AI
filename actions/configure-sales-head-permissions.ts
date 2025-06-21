"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

export async function configureSalesHeadPermissions() {
  try {
    console.log("🔧 Configuring Sales Head permissions using PostgreSQL...")

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

    // Execute the SQL directly using PostgreSQL
    await query(sqlContent)

    // Revalidate relevant paths
    revalidatePath("/admin/role-permissions")
    revalidatePath("/admin/test-rbac")

    console.log("✅ Sales Head permissions configured successfully")
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
