"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function executeMigration(): Promise<{
  success: boolean
  message: string
  details?: string[]
}> {
  try {
    console.log("🔄 [MIGRATION] Executing migration via PostgreSQL...")
    
    // Check if leads table exists
    const tableResult = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'leads' AND table_schema = 'public'
    `)
    
    if (tableResult.rows.length === 0) {
      return { success: false, message: "Leads table does not exist" }
    }

    // Add rejection columns if they don't exist
    await query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
      ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS rejected_by TEXT
    `)

    console.log("✅ [MIGRATION] Migration completed successfully")
    return { success: true, message: "Migration executed successfully" }
  } catch (error) {
    console.error("❌ [MIGRATION] Error:", error)
    return { success: false, message: `Migration failed: ${error}` }
  }
}

export async function verifyRejectionColumns(): Promise<{
  success: boolean
  message: string
  columns?: { name: string; exists: boolean; type?: string }[]
}> {
  try {
    console.log("🔍 [MIGRATION] Verifying rejection columns via PostgreSQL...")

    // Check each column individually using PostgreSQL
    const columnsToCheck = ["rejection_reason", "rejected_at", "rejected_by"]
    const results = []

    for (const columnName of columnsToCheck) {
      try {
        // Check if column exists
        const columnResult = await query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'leads' AND column_name = $1
        `, [columnName])

        if (columnResult.rows.length > 0) {
          results.push({ 
            name: columnName, 
            exists: true, 
            type: columnResult.rows[0].data_type 
          })
        } else {
          results.push({ name: columnName, exists: false })
        }
      } catch (columnError) {
        console.error(`❌ [MIGRATION] Error checking column ${columnName}:`, columnError)
        results.push({ name: columnName, exists: false, error: (columnError as Error).message || String(columnError) })
      }
    }

    const allExist = results.every((col) => col.exists)

    console.log(`✅ [MIGRATION] Column verification completed: ${allExist ? 'All exist' : 'Some missing'}`)
    return {
      success: allExist,
      message: allExist
        ? "All rejection columns exist in the leads table"
        : "Some rejection columns are missing from the leads table",
      columns: results,
    }
  } catch (error: any) {
    console.error("❌ [MIGRATION] Error verifying rejection columns:", error)
    return {
      success: false,
      message: "An unexpected error occurred while verifying columns",
    }
  }
} 