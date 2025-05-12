"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateLeadFollowupsTable(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // Execute the SQL to update the lead_followups table using the correct method
    const { error } = await supabase.rpc("exec_sql", {
      sql_string: `
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE lead_followups 
            ALTER COLUMN created_by DROP NOT NULL;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error making created_by nullable: %', SQLERRM;
          END;
        END $$;

        DO $$
        BEGIN
          BEGIN
            ALTER TABLE lead_followups 
            ALTER COLUMN created_by TYPE TEXT;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error changing created_by to TEXT: %', SQLERRM;
          END;
        END $$;
      `,
    })

    if (error) {
      console.error("Error updating lead_followups table:", error)
      return { success: false, message: `Failed to update lead_followups table: ${error.message}` }
    }

    return { success: true, message: "Lead followups table updated successfully" }
  } catch (error) {
    console.error("Error updating lead_followups table:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
