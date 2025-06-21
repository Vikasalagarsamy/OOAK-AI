"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function createExecSqlWithResultFunction(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 Creating exec_sql_with_result function using PostgreSQL...")

    const sql = `
      -- Create a function to execute SQL and return results
      CREATE OR REPLACE FUNCTION exec_sql_with_result(sql_query text)
      RETURNS SETOF json AS $$
      BEGIN
        RETURN QUERY EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Grant execute permission to authenticated users
      GRANT EXECUTE ON FUNCTION exec_sql_with_result(text) TO authenticated;
    `

    // Execute the SQL directly using PostgreSQL
    await query(sql)

    console.log("✅ exec_sql_with_result function created successfully")
    return { success: true, message: "exec_sql_with_result function created successfully" }
  } catch (error) {
    console.error("Error creating exec_sql_with_result function:", error)
    return { success: false, message: `An unexpected error occurred: ${error}` }
  }
}
