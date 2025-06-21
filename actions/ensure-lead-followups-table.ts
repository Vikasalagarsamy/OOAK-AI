"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function ensureLeadFollowupsTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 [LEAD FOLLOWUPS] Ensuring lead_followups table exists via PostgreSQL...")

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS lead_followups (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        followup_type VARCHAR(50) NOT NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        notes TEXT,
        created_by VARCHAR(255), -- Changed from UUID to VARCHAR for compatibility
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        completed_by VARCHAR(255) -- Changed from UUID to VARCHAR for compatibility
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_lead_followups_lead_id ON lead_followups(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_followups_scheduled_at ON lead_followups(scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_lead_followups_completed ON lead_followups(completed);
    `

    // Execute the SQL directly using PostgreSQL
    await query(createTableSQL)

    console.log("✅ [LEAD FOLLOWUPS] Lead followups table created/verified successfully")
    revalidatePath("/sales/my-leads")
    return { success: true, message: "Lead followups table created or verified successfully" }
  } catch (error: any) {
    console.error("❌ [LEAD FOLLOWUPS] Error creating lead_followups table:", error)
    return { success: false, message: `Failed to create table: ${error.message}` }
  }
}
