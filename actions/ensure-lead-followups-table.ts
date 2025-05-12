"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function ensureLeadFollowupsTable(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS lead_followups (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        followup_type VARCHAR(50) NOT NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        notes TEXT,
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        completed_by UUID REFERENCES auth.users(id)
      );
    `

    const { error } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (error) {
      console.error("Error creating lead_followups table:", error)
      return { success: false, message: `Failed to create table: ${error.message}` }
    }

    revalidatePath("/sales/my-leads")
    return { success: true, message: "Lead followups table created or verified successfully" }
  } catch (error) {
    console.error("Unexpected error creating lead_followups table:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
