"use server"

import { query, transaction } from "@/lib/postgresql-client"

/**
 * Server action to manually add the lead_source column to the leads table
 */
export async function manuallyAddLeadSourceColumn(): Promise<{ success: boolean; message: string }> {
  try {
    // First check if the column already exists
    const columnExistsResult = await query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = $1 
         AND column_name = $2 
         AND table_schema = 'public'`,
      ["leads", "lead_source"]
    )

    // If column already exists, return success
    if (columnExistsResult.rows && columnExistsResult.rows.length > 0) {
      return { success: true, message: "Column already exists" }
    }

    // Add the column directly using PostgreSQL DDL
    await query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT")

    return { success: true, message: "Column added successfully" }
  } catch (error) {
    console.error("Error in manuallyAddLeadSourceColumn:", error)
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
