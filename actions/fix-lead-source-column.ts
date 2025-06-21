"use server"

import { query } from "@/lib/postgresql-client"

export async function addLeadSourceColumn(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 [LEAD_COLUMN] Starting lead_source column addition via PostgreSQL...")

    // Check if either lead_source or lead_source_id column already exists
    console.log("🔍 [LEAD_COLUMN] Checking for existing lead source columns...")
    const columnCheckResult = await query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'leads' 
      AND column_name IN ('lead_source', 'lead_source_id')
      ORDER BY column_name
    `)

    const existingColumns = columnCheckResult.rows

    // If any column already exists, return success
    if (existingColumns && existingColumns.length > 0) {
      const columnName = existingColumns[0].column_name
      console.log(`✅ [LEAD_COLUMN] Column ${columnName} already exists`)
      return {
        success: true,
        message: `Column ${columnName} already exists`
      }
    }

    console.log("➕ [LEAD_COLUMN] Adding lead_source column to leads table...")

    // Add the lead_source column with proper constraints
    await query(`
      ALTER TABLE leads 
      ADD COLUMN lead_source TEXT DEFAULT 'direct'
    `)

    console.log("📝 [LEAD_COLUMN] Setting default values for existing records...")

    // Update any existing NULL values (though there shouldn't be any with DEFAULT)
    const updateResult = await query(`
      UPDATE leads 
      SET lead_source = 'direct' 
      WHERE lead_source IS NULL
    `)

    console.log(`📊 [LEAD_COLUMN] Updated ${updateResult.rowCount || 0} existing records`)

    // Create index for better query performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_leads_lead_source 
      ON leads(lead_source)
    `)

    // Add a check constraint for common lead source values
    try {
      await query(`
        ALTER TABLE leads 
        ADD CONSTRAINT leads_lead_source_check 
        CHECK (lead_source IN (
          'direct', 'website', 'referral', 'social_media', 'email_campaign', 
          'phone_call', 'advertisement', 'event', 'partner', 'unknown', 'other'
        ) OR lead_source IS NULL)
      `)
      console.log("🛡️ [LEAD_COLUMN] Added validation constraint for lead_source values")
    } catch (constraintError) {
      console.log("ℹ️ [LEAD_COLUMN] Constraint already exists or couldn't be added")
    }

    console.log("✅ [LEAD_COLUMN] Lead source column added successfully!")
    return {
      success: true,
      message: "Successfully added lead_source column to leads table with constraints and index"
    }

  } catch (error: any) {
    console.error("❌ [LEAD_COLUMN] Error adding lead_source column:", error)
    
    // Handle specific PostgreSQL errors gracefully
    if (error.message && error.message.includes('already exists')) {
      return {
        success: true,
        message: "Lead source column already exists"
      }
    }

    return {
      success: false,
      message: `Failed to add lead_source column: ${error.message || "Unknown error"}`
    }
  }
} 