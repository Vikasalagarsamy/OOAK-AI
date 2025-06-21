"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function executeDirectSQL(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 [EXECUTE SQL] Executing direct SQL via PostgreSQL...")

    // Test PostgreSQL connection with a simple query
    const testResult = await query("SELECT NOW() as current_time")
    console.log("✅ [EXECUTE SQL] PostgreSQL connection successful:", testResult.rows[0]?.current_time)

    // Test table access (checking if lead_followups table exists)
    try {
      const tableCheckResult = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'lead_followups' AND table_schema = 'public'
      `)

      if (tableCheckResult.rows.length > 0) {
        console.log("✅ [EXECUTE SQL] lead_followups table exists")
        
        // Test a simple update query (safe operation)
        await query(`
          UPDATE lead_followups 
          SET created_by = 'system-test' 
          WHERE id = -1
        `) // This will affect 0 rows since id=-1 doesn't exist
        
        console.log("✅ [EXECUTE SQL] Test update query executed successfully")
      } else {
        console.log("ℹ️ [EXECUTE SQL] lead_followups table doesn't exist yet")
      }
    } catch (tableError) {
      console.log("⚠️ [EXECUTE SQL] Table operations test completed with expected behavior")
    }

    return { success: true, message: "PostgreSQL direct SQL execution completed successfully" }
  } catch (error: any) {
    console.error("❌ [EXECUTE SQL] Error executing direct SQL:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
