import { createClient } from "@/lib/supabase/server"

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns A promise that resolves to a boolean indicating if the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_name", tableName)
      .maybeSingle()

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Exception checking if table ${tableName} exists:`, error)
    return false
  }
}

/**
 * Safely executes a query, catching any errors
 * @param queryFn The query function to execute
 * @returns The result of the query or the default value if an error occurred
 */
export async function safeQuery<T>(queryFn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await queryFn()
  } catch (error) {
    console.error("Error executing query:", error)
    return defaultValue
  }
}
