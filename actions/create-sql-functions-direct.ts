"use server"

import { createServiceClient } from "@/lib/supabase-singleton"

export async function createSqlFunctionsDirect() {
  try {
    // Use the service role client which has more permissions
    const supabase = createServiceClient()

    // Execute raw SQL to create the functions
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return { success: false, error: "Authentication error: " + error.message }
    }

    // Use the PostgreSQL interface directly if available
    try {
      // Try to use the direct SQL execution method if available
      const result = await fetch("/api/admin/execute-sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: `
            -- Create exec_sql function
            CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
            RETURNS VOID AS $$
            BEGIN
              EXECUTE sql_query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
            
            -- Create exec_sql_with_result function
            CREATE OR REPLACE FUNCTION exec_sql_with_result(sql_query TEXT)
            RETURNS SETOF json AS $$
            BEGIN
              RETURN QUERY EXECUTE sql_query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `,
        }),
      })

      if (!result.ok) {
        const errorData = await result.json()
        throw new Error(errorData.error || "API call failed")
      }

      return { success: true }
    } catch (sqlError) {
      console.error("Error executing SQL directly:", sqlError)
      return {
        success: false,
        error: sqlError instanceof Error ? sqlError.message : "SQL execution failed",
      }
    }
  } catch (error) {
    console.error("Error in createSqlFunctionsDirect:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
