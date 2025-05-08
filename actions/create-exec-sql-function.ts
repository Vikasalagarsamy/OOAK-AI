"use server"

import { createClient } from "@/lib/supabase/server"

export async function createExecSqlFunction() {
  try {
    const supabase = createClient()

    // SQL to create the exec_sql function if it doesn't exist
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Execute the SQL to create the function
    const { error } = await supabase.rpc("exec_sql", { sql: createFunctionSql })

    // If the function doesn't exist yet, we need to execute the SQL directly
    if (error && error.message.includes("function") && error.message.includes("does not exist")) {
      const { error: directError } = await supabase.query(createFunctionSql)

      if (directError) {
        console.error("Error creating exec_sql function directly:", directError)
        return { success: false, error: directError.message }
      }

      return { success: true }
    }

    if (error) {
      console.error("Error creating exec_sql function:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error creating exec_sql function:", error)
    return { success: false, error: error.message }
  }
}
