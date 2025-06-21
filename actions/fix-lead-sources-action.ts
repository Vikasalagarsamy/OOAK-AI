"use server"

import { query } from "@/lib/postgresql-client"

export async function fixLeadSourcesActiveStatus(): Promise<{
  success: boolean
  message: string
  updatedCount?: number
}> {
  try {
    console.log("🔧 [LEAD_SOURCES] Starting lead sources active status fix via PostgreSQL...")

    // Check if lead_sources table exists
    console.log("🔍 [LEAD_SOURCES] Checking if lead_sources table exists...")
    const tableExistsResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_sources'
      ) as table_exists
    `)

    const tableExists = tableExistsResult.rows[0]?.table_exists

    if (!tableExists) {
      console.log("⚠️ [LEAD_SOURCES] Table does not exist, creating it...")
      
      // Create the lead_sources table
      await query(`
        CREATE TABLE lead_sources (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          sort_order INTEGER DEFAULT 0
        )
      `)

      // Insert default lead sources
      await query(`
        INSERT INTO lead_sources (name, description, is_active, sort_order) VALUES
        ('Direct', 'Direct contact or walk-in', true, 1),
        ('Website', 'Website inquiry or form submission', true, 2),
        ('Referral', 'Referred by existing customer', true, 3),
        ('Social Media', 'Social media platforms', true, 4),
        ('Email Campaign', 'Email marketing campaigns', true, 5),
        ('Phone Call', 'Inbound phone calls', true, 6),
        ('Advertisement', 'Paid advertisements', true, 7),
        ('Event', 'Trade shows, exhibitions, events', true, 8),
        ('Partner', 'Business partner referrals', true, 9),
        ('Other', 'Other sources', true, 10)
        ON CONFLICT (name) DO NOTHING
      `)

      console.log("✅ [LEAD_SOURCES] Created lead_sources table with default data")
      return {
        success: true,
        message: "Successfully created lead_sources table with default active sources",
        updatedCount: 10
      }
    }

    console.log("📊 [LEAD_SOURCES] Checking current lead sources status...")

    // Get count of inactive and null lead sources
    const statusCheckResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = false) as inactive_count,
        COUNT(*) FILTER (WHERE is_active IS NULL) as null_count,
        COUNT(*) as total_count
      FROM lead_sources
    `)

    const { inactive_count, null_count, total_count } = statusCheckResult.rows[0]
    console.log(`🔍 [LEAD_SOURCES] Found ${total_count} total, ${inactive_count} inactive, ${null_count} null status`)

    let totalUpdated = 0

    // Update inactive lead sources to active
    if (parseInt(inactive_count) > 0) {
      console.log("📝 [LEAD_SOURCES] Updating inactive lead sources to active...")
      const updateInactiveResult = await query(`
        UPDATE lead_sources 
        SET is_active = true, updated_at = NOW() 
        WHERE is_active = false
        RETURNING id
      `)
      
      const inactiveUpdated = updateInactiveResult.rowCount || 0
      totalUpdated += inactiveUpdated
      console.log(`✅ [LEAD_SOURCES] Updated ${inactiveUpdated} inactive lead sources`)
    }

    // Update NULL is_active to true
    if (parseInt(null_count) > 0) {
      console.log("📝 [LEAD_SOURCES] Updating NULL is_active values to true...")
      const updateNullResult = await query(`
        UPDATE lead_sources 
        SET is_active = true, updated_at = NOW() 
        WHERE is_active IS NULL
        RETURNING id
      `)
      
      const nullUpdated = updateNullResult.rowCount || 0
      totalUpdated += nullUpdated
      console.log(`✅ [LEAD_SOURCES] Updated ${nullUpdated} null status lead sources`)
    }

    // Ensure the is_active column has proper constraints
    console.log("🛡️ [LEAD_SOURCES] Adding/updating constraints...")
    
    try {
      // Try to add NOT NULL constraint if it doesn't exist
      await query(`
        ALTER TABLE lead_sources 
        ALTER COLUMN is_active SET NOT NULL
      `)
      console.log("✅ [LEAD_SOURCES] Set is_active column to NOT NULL")
    } catch (constraintError) {
      // Constraint might already exist, that's fine
      console.log("ℹ️ [LEAD_SOURCES] is_active constraint already exists or couldn't be added")
    }

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lead_sources_active 
      ON lead_sources(is_active) WHERE is_active = true;
      
      CREATE INDEX IF NOT EXISTS idx_lead_sources_name 
      ON lead_sources(name);
      
      CREATE INDEX IF NOT EXISTS idx_lead_sources_sort 
      ON lead_sources(sort_order);
    `)

    console.log("🚀 [LEAD_SOURCES] Created performance indexes")

    console.log(`🎉 [LEAD_SOURCES] Lead sources fix completed! Updated ${totalUpdated} records`)

    return {
      success: true,
      message: totalUpdated > 0
        ? `Successfully updated ${totalUpdated} lead sources to active status.`
        : "All lead sources are already active.",
      updatedCount: totalUpdated
    }

  } catch (error: any) {
    console.error("❌ [LEAD_SOURCES] Error fixing lead sources active status:", error)
    return {
      success: false,
      message: `Failed to fix lead sources: ${error.message || "Unknown error"}`
    }
  }
} 