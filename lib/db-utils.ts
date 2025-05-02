import { createClient } from "@/lib/supabase"

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns A promise that resolves to a boolean indicating if the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // First approach: Try to query the information_schema.tables view
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", tableName)
      .eq("table_schema", "public")
      .maybeSingle()

    if (!error && data) {
      return true
    }

    // Second approach: If the first approach fails, try to select from the table with a limit of 0
    try {
      const { error: queryError } = await supabase.from(tableName).select("*", { count: "exact", head: true }).limit(0)

      // If there's no error, the table exists
      return !queryError
    } catch (innerError) {
      console.error(`Error checking table existence with direct query: ${innerError}`)
      return false
    }
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)

    // Third approach: Try a RPC call to a custom function if it exists
    try {
      const { data, error: rpcError } = await supabase.rpc("check_table_exists", { table_name: tableName })
      if (!rpcError && data) {
        return data
      }
    } catch (rpcError) {
      console.error(`Error calling check_table_exists RPC: ${rpcError}`)
    }

    return false
  }
}

/**
 * Safely executes a query that might fail if a table doesn't exist
 * @param queryFn The query function to execute
 * @param fallback The fallback value to return if the query fails
 * @returns The result of the query or the fallback value
 */
export async function safeQuery<T>(queryFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await queryFn()
  } catch (error) {
    console.error("Error executing query:", error)
    return fallback
  }
}
