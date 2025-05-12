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

    // Use the correct method to execute raw SQL
    const { error: directError } = await supabase
      .rpc("exec_sql_direct", {
        sql_query: createFunctionSql,
      })
      .catch(async (err) => {
        console.log("RPC method failed, trying alternative approach:", err.message)

        // If the RPC method doesn't exist yet, try using the REST API
        return await supabase.from("_exec_sql_fallback").insert({ sql: createFunctionSql }).select()
      })
      .catch(async (err) => {
        console.log("Insert method failed, trying direct SQL:", err.message)

        // Final fallback: try using the REST API with a special endpoint
        return await fetch("/api/admin/execute-sql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sql: createFunctionSql }),
        }).then((res) => res.json())
      })

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
