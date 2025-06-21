"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateLeadFollowupsTableAlternative(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // First, try to make created_by nullable
    const { error: error1 } = await supabase.query(`
      ALTER TABLE lead_followups 
      ALTER COLUMN created_by DROP NOT NULL;
    `)

    if (error1) {
      console.warn("Warning making created_by nullable:", error1)
      // Continue with the next operation even if this one fails
    }

    // Then, try to change created_by to TEXT type
    const { error: error2 } = await supabase.query(`
      ALTER TABLE lead_followups 
      ALTER COLUMN created_by TYPE TEXT;
    `)

    if (error2) {
      console.warn("Warning changing created_by to TEXT:", error2)
      // Continue even if this operation fails
    }

    // If both operations failed, return an error
    if (error1 && error2) {
      return {
        success: false,
        message: "Failed to update lead_followups table. Please check the console for details.",
      }
    }

    return {
      success: true,
      message: "Lead followups table updated successfully (some operations may have been skipped)",
    }
  } catch (error) {
    console.error("Error updating lead_followups table:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
