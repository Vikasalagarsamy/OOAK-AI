"use server"

import { query, transaction } from "@/lib/postgresql-client"

/**
 * Directly adds the lead_source column to the leads table using raw SQL
 * This is a last resort if other methods fail
 */
export async function addLeadSourceDirectly(): Promise<boolean> {
  try {
    // Try to execute the SQL directly
    await query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT")

    console.log("✅ Lead source column added successfully")
    return true
  } catch (error) {
    console.error("Error adding lead_source column directly:", error)
    return false
  }
}
