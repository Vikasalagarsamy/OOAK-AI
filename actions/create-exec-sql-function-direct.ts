"use server"

import { createClient } from "@/lib/supabase/server"

export async function createExecSqlFunctionDirect() {
  try {
    const supabase = createClient()

    // Check if the function already exists
    const { data: functionExists, error: checkError } = await supabase
      .from("pg_proc")
      .select("proname")
      .eq("proname", "exec_sql")
      .maybeSingle()

    if (checkError) {
      console.error("Error checking if function exists:", checkError)
      // Continue anyway, as the function might not exist
    }

    if (functionExists) {
      console.log("exec_sql function already exists")
      return { success: true }
    }

    // Try using an existing function to create our function
    const { error: createError } = await supabase.rpc("create_function_if_not_exists", {
      function_name: "exec_sql",
      function_args: "sql_query text",
      function_returns: "void",
      function_body: "BEGIN EXECUTE sql_query; END;",
      function_language: "plpgsql",
      security_type: "SECURITY DEFINER",
    })

    if (createError) {
      console.error("Error creating function using RPC:", createError)
      return {
        success: false,
        error: `Failed to create exec_sql function: ${createError.message}`,
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
