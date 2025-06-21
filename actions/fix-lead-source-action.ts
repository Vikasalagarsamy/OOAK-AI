"use server"

import { query } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function fixLeadSourceColumn(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 [LEAD_SOURCE] Starting lead_source column fix via PostgreSQL...")

    // Check if the column already exists using information_schema
    console.log("🔍 [LEAD_SOURCE] Checking if lead_source column exists...")
    const columnCheckResult = await query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'lead_source'
      ) as column_exists
    `)

    const columnExists = columnCheckResult.rows[0]?.column_exists

    if (columnExists) {
      console.log("✅ [LEAD_SOURCE] Column already exists")
      return { success: true, message: "Lead source column already exists" }
    }

    console.log("➕ [LEAD_SOURCE] Adding lead_source column to leads table...")

    // Add the column with proper constraints
    await query(`
      ALTER TABLE leads 
      ADD COLUMN lead_source TEXT DEFAULT 'unknown'
    `)

    // Update existing records to have a default value
    const updateResult = await query(`
      UPDATE leads 
      SET lead_source = 'direct' 
      WHERE lead_source IS NULL
    `)

    console.log(`📝 [LEAD_SOURCE] Updated ${updateResult.rowCount || 0} existing records with default lead_source`)

    // Create an index for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_leads_lead_source 
      ON leads(lead_source)
    `)

    console.log("🚀 [LEAD_SOURCE] Created performance index for lead_source")

    revalidatePath("/sales/create-lead")
    console.log("✅ [LEAD_SOURCE] Lead source column added successfully!")
    
    return { 
      success: true, 
      message: "Lead source column added successfully with default values and index" 
    }

  } catch (error: any) {
    console.error("❌ [LEAD_SOURCE] Error fixing lead source column:", error)
    
    // If the error is about the column already existing, that's actually success
    if (error.message && error.message.includes('already exists')) {
      return { success: true, message: "Lead source column already exists" }
    }

    return {
      success: false,
      message: `Failed to add lead source column: ${error.message || "Unknown error"}`
    }
  }
}
