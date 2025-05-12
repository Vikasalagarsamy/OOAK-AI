"use server"

import { createClient } from "@/lib/supabase/server"

export async function createExecSqlWithResultFunction(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const sql = `
      -- Create a function to execute SQL and return results
      CREATE OR REPLACE FUNCTION exec_sql_with_result(sql text)
      RETURNS SETOF json AS $$
      BEGIN
        RETURN QUERY EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Grant execute permission to authenticated users
      GRANT EXECUTE ON FUNCTION exec_sql_with_result(text) TO authenticated;
    `

    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Error creating exec_sql_with_result function:", error)
      return { success: false, message: `Failed to create function: ${error.message}` }
    }

    return { success: true, message: "exec_sql_with_result function created successfully" }
  } catch (error) {
    console.error("Unexpected error creating exec_sql_with_result function:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
