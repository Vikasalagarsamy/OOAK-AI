"use server"

import { createClient } from "@/lib/supabase"

export async function ensureLeadSourcesTable(): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient()

    // Check if the table exists by trying to count rows
    const { error: checkError } = await supabase
      .from("lead_sources")
      .select("*", { count: "exact", head: true })
      .limit(1)

    if (!checkError) {
      // Table exists
      return { success: true, message: "lead_sources table already exists" }
    }

    // Table doesn't exist, create it
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: `
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
      `,
    })

    if (createError) {
      throw new Error(`Failed to create lead_sources table: ${createError.message}`)
    }

    return { success: true, message: "lead_sources table created successfully" }
  } catch (error) {
    console.error("Error ensuring lead_sources table:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error creating lead_sources table",
    }
  }
}
