"use server"

import { createClient } from "@/lib/supabase/server"
import { ensureExecSqlFunction } from "./ensure-exec-sql-function"

export async function addIsTestColumnToFollowups() {
  try {
    // First, ensure the exec_sql function exists
    const functionResult = await ensureExecSqlFunction()
    if (!functionResult.success) {
      return functionResult
    }

    const supabase = createClient()

    // Check if the column already exists
    const { data: columnExists, error: checkError } = await supabase.rpc("column_exists", {
      table_name: "lead_followups",
      column_name: "is_test",
    })

    if (checkError) {
      // If the column_exists function doesn't exist, we need to create it
      if (checkError.message.includes("function") && checkError.message.includes("does not exist")) {
        // Create the column_exists function
        const createColumnExistsFunctionSql = `
          CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
          RETURNS boolean AS $$
          DECLARE
            exists_bool boolean;
          BEGIN
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = $1
              AND column_name = $2
            ) INTO exists_bool;
            
            RETURN exists_bool;
          END;
          $$ LANGUAGE plpgsql;
        `

        const { error: createFunctionError } = await supabase.query(createColumnExistsFunctionSql)

        if (createFunctionError) {
          return {
            success: false,
            error: `Failed to create column_exists function: ${createFunctionError.message}`,
          }
        }

        // Now check if the column exists using direct query
        const { data: columnCheckData, error: directCheckError } = await supabase
          .from("information_schema.columns")
          .select("column_name")
          .eq("table_name", "lead_followups")
          .eq("column_name", "is_test")
          .maybeSingle()

        if (directCheckError) {
          return {
            success: false,
            error: `Failed to check if column exists: ${directCheckError.message}`,
          }
        }

        if (columnCheckData?.column_name === "is_test") {
          return { success: true }
        }
      } else {
        return {
          success: false,
          error: `Failed to check if column exists: ${checkError.message}`,
        }
      }
    } else if (columnExists) {
      // Column already exists, no need to add it
      return { success: true }
    }

    // Add the is_test column
    const addColumnSql = `
      ALTER TABLE lead_followups 
      ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;
      
      CREATE INDEX IF NOT EXISTS idx_lead_followups_is_test 
      ON lead_followups(is_test);
    `

    // Execute the SQL using direct query
    const { error: alterError } = await supabase.query(addColumnSql)

    if (alterError) {
      return {
        success: false,
        error: `Failed to add is_test column: ${alterError.message}`,
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error adding is_test column:", error)
    return {
      success: false,
      error: `Unexpected error: ${error.message}`,
    }
  }
}
