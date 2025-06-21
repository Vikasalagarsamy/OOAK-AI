"use server"

import { query, transaction } from "@/lib/postgresql-client"

/**
 * Checks if the lead_source column exists in the leads table
 * @returns Object with column existence status and details
 */
export async function checkLeadSourceColumnExists(): Promise<{
  exists: boolean
  details?: any
  allColumns?: any[]
  error?: string
}> {
  try {
    console.log("🔍 Checking lead_source column existence using PostgreSQL...")

    // Check if lead_source column exists
    const columnCheckResult = await query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = $2 AND table_schema = 'public'`,
      ["leads", "lead_source"]
    )

    // Get all columns for reference
    const allColumnsResult = await query(
      `SELECT column_name, data_type, ordinal_position
       FROM information_schema.columns 
       WHERE table_name = $1 AND table_schema = 'public'
       ORDER BY ordinal_position`,
      ["leads"]
    )

    const exists = columnCheckResult.rows && columnCheckResult.rows.length > 0
    const details = exists ? columnCheckResult.rows[0] : undefined
    const allColumns = allColumnsResult.rows || []

    console.log(`✅ Schema check complete. lead_source column exists: ${exists}`)
    console.log(`📊 Total columns in leads table: ${allColumns.length}`)

    return {
      exists,
      details,
      allColumns,
      error: undefined,
    }
  } catch (error) {
    console.error("Error checking database schema:", error)
    return {
      exists: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
