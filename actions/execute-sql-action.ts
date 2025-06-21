"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function executeSql(sql: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 [EXECUTE SQL] Executing SQL query via PostgreSQL...")
    console.log("📝 [EXECUTE SQL] SQL:", sql.substring(0, 100) + (sql.length > 100 ? "..." : ""))

    // Execute the SQL directly using PostgreSQL
    const result = await query(sql)

    console.log("✅ [EXECUTE SQL] SQL executed successfully via PostgreSQL")
    return { 
      success: true, 
      message: `SQL executed successfully. Rows affected: ${result.rowCount || 0}` 
    }
  } catch (error: any) {
    console.error("❌ [EXECUTE SQL] Error executing SQL:", error)
    return { 
      success: false, 
      message: `SQL execution failed: ${error.message}` 
    }
  }
}
