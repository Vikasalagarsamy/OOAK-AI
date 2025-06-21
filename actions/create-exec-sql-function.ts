"use server"

import { query, transaction } from "@/lib/postgresql-client"

export async function createExecSqlFunction() {
  try {
    console.log("🔧 Creating exec_sql function using PostgreSQL...")

    // SQL to create the exec_sql function if it doesn't exist
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Grant execute permission to appropriate roles
      GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
    `

    // Execute the SQL directly using PostgreSQL
    await query(createFunctionSql)

    console.log("✅ exec_sql function created successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Error creating exec_sql function:", error)
    return { success: false, error: error.message }
  }
}
