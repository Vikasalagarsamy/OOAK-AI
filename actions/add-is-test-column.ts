"use server"

import { getSupabaseServer } from "@/lib/supabase-client"
import fs from "fs"
import path from "path"

export async function addIsTestColumnToFollowups() {
  try {
    const supabase = getSupabaseServer()

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "sql", "add-is-test-column-to-followups.sql")
    const sql = fs.existsSync(sqlPath)
      ? fs.readFileSync(sqlPath, "utf8")
      : `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'lead_followups'
                AND column_name = 'is_test'
            ) THEN
                ALTER TABLE lead_followups ADD COLUMN is_test BOOLEAN DEFAULT FALSE;
                CREATE INDEX idx_lead_followups_is_test ON lead_followups(is_test);
            END IF;
        END $$;
      `

    // Execute the SQL
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("Error adding is_test column:", error)
      return {
        success: false,
        message: "Failed to add is_test column",
        error: error.message,
      }
    }

    return {
      success: true,
      message: "Successfully added is_test column to lead_followups table",
    }
  } catch (error) {
    console.error("Unexpected error adding is_test column:", error)
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
