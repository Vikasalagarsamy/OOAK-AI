"use server"

import { createClient } from "@/lib/supabase/server"

export async function ensureExecSqlFunction() {
  try {
    const supabase = createClient()

    // SQL to create the exec_sql function
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Execute the SQL directly to create the function
    const { error: directError } = await supabase.query(createFunctionSql)

    if (directError) {
      console.error("Error creating exec_sql function:", directError)
      return {
        success: false,
        error: `Failed to create exec_sql function: ${directError.message}`,
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error creating exec_sql function:", error)
    return {
      success: false,
      error: `Unexpected error: ${error.message}`,
    }
  }
}
