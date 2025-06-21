"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function ensureLeadSourcesTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 [LEAD SOURCES] Ensuring lead_sources table exists via PostgreSQL...")

    // Check if the table exists by trying to query it
    try {
      await query("SELECT 1 FROM lead_sources LIMIT 1")
      console.log("✅ [LEAD SOURCES] lead_sources table already exists")
      return { success: true, message: "lead_sources table already exists" }
    } catch (tableCheckError) {
      console.log("📝 [LEAD SOURCES] lead_sources table doesn't exist, creating it...")
    }

    // Table doesn't exist, create it with default data
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS lead_sources (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Add some default sources if the table is empty
      INSERT INTO lead_sources (name, description)
      SELECT source, 'Default source'
      FROM (
        VALUES 
          ('Website'),
          ('Referral'),
          ('Social Media'),
          ('Email Campaign'),
          ('Phone Inquiry'),
          ('Event'),
          ('Other')
      ) AS default_sources(source)
      WHERE NOT EXISTS (SELECT 1 FROM lead_sources LIMIT 1);

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_lead_sources_name ON lead_sources(name);
      CREATE INDEX IF NOT EXISTS idx_lead_sources_active ON lead_sources(active);
    `

    // Execute the SQL directly using PostgreSQL
    await query(createTableSQL)

    console.log("✅ [LEAD SOURCES] lead_sources table created successfully")
    return { success: true, message: "lead_sources table created successfully" }
  } catch (error: any) {
    console.error("❌ [LEAD SOURCES] Error ensuring lead_sources table:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error creating lead_sources table",
    }
  }
} 