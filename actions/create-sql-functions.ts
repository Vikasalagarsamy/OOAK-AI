"use server"

import { createClient } from "@/lib/postgresql-client"

export async function createSqlFunctions() {
  const client = createClient()

  try {
    console.log("🔧 Creating PostgreSQL SQL functions...")

    // Create the exec_sql function
    await client.query(`
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)

    console.log("✅ Created exec_sql function")

    // Create the exec_sql_with_result function
    await client.query(`
      CREATE OR REPLACE FUNCTION exec_sql_with_result(sql_query TEXT)
      RETURNS SETOF json AS $$
      BEGIN
        RETURN QUERY EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)

    console.log("✅ Created exec_sql_with_result function")

    return { success: true, message: "SQL functions created successfully" }
  } catch (error) {
    console.error("❌ Error creating SQL functions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
