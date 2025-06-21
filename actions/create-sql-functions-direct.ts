"use server"

import { createClient } from "@/lib/postgresql-client"

export async function createSqlFunctionsDirect() {
  try {
    const { query, transaction } = createClient()

    console.log("🔧 Creating SQL functions directly via PostgreSQL...")

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

    console.log("✅ SQL functions created successfully via API")
    return { success: true, message: "Functions created via direct SQL execution" }
  } catch (error) {
    console.error("❌ Error in createSqlFunctionsDirect:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
