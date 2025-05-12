"use server"

import { createClient } from "@/lib/supabase/server"

export async function createSqlFunctions() {
  const supabase = createClient()

  try {
    // Create the exec_sql function using the correct Supabase method
    const { error: execSqlError } = await supabase.from("").select("*").limit(1).execute()

    // If we can execute a query, we can try to create our functions
    // First, let's try to create the exec_sql function
    const createExecSqlResult = await supabase
      .from("")
      .select(`
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
      .execute()

    if (createExecSqlResult.error) {
      console.error("Error creating exec_sql function:", createExecSqlResult.error)

      // Try an alternative approach using rpc if available
      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql_query: `
            CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
            RETURNS VOID AS $$
            BEGIN
              EXECUTE sql_query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `,
        })

        if (error) {
          throw error
        }
      } catch (rpcError) {
        console.error("RPC approach also failed:", rpcError)
        return {
          success: false,
          error: "Could not create SQL functions. Please check server logs for details.",
        }
      }
    }

    // Now create the exec_sql_with_result function
    const createExecSqlWithResultResult = await supabase
      .from("")
      .select(`
      CREATE OR REPLACE FUNCTION exec_sql_with_result(sql_query TEXT)
      RETURNS SETOF json AS $$
      BEGIN
        RETURN QUERY EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
      .execute()

    if (createExecSqlWithResultResult.error) {
      console.error("Error creating exec_sql_with_result function:", createExecSqlWithResultResult.error)

      // Try an alternative approach
      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql_query: `
            CREATE OR REPLACE FUNCTION exec_sql_with_result(sql_query TEXT)
            RETURNS SETOF json AS $$
            BEGIN
              RETURN QUERY EXECUTE sql_query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `,
        })

        if (error) {
          throw error
        }
      } catch (rpcError) {
        console.error("RPC approach also failed for second function:", rpcError)
        return {
          success: false,
          error: "Could create first function but failed on second. Please check server logs.",
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error creating SQL functions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
