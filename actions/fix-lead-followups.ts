"use server"

import { createClient } from "@/lib/supabase/server"

export async function fixLeadFollowups(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // Create a simple function to handle follow-up scheduling without UUID issues
    const { error } = await supabase.query(`
      CREATE OR REPLACE FUNCTION schedule_lead_followup(
        p_lead_id TEXT,
        p_followup_date TIMESTAMP,
        p_notes TEXT,
        p_status TEXT DEFAULT 'pending'
      ) RETURNS UUID AS $$
      DECLARE
        v_followup_id UUID;
      BEGIN
        INSERT INTO lead_followups (
          lead_id,
          followup_date,
          notes,
          status
        ) VALUES (
          p_lead_id,
          p_followup_date,
          p_notes,
          p_status
        ) RETURNING id INTO v_followup_id;
        
        RETURN v_followup_id;
      END;
      $$ LANGUAGE plpgsql;
    `)

    if (error) {
      console.error("Error creating schedule_lead_followup function:", error)
      return { success: false, message: `Failed to create function: ${error.message}` }
    }

    return { success: true, message: "Lead followups function created successfully" }
  } catch (error) {
    console.error("Error fixing lead followups:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
