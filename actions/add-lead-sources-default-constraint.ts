"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function addLeadSourcesDefaultConstraint(): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Check if the lead_sources table exists
    const tableExistsResult = await query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_name = $1 
         AND table_schema = 'public'`,
      ["lead_sources"]
    )

    if (!tableExistsResult.rows || tableExistsResult.rows.length === 0) {
      return {
        success: false,
        message: "lead_sources table does not exist",
      }
    }

    // Add the default constraint
    await query("ALTER TABLE lead_sources ALTER COLUMN is_active SET DEFAULT true")

    return {
      success: true,
      message: "Default constraint added successfully to is_active column",
    }
  } catch (error) {
    console.error("Error adding default constraint:", error)
    return {
      success: false,
      message: `Failed to add default constraint: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
