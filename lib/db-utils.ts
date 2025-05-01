import { createClient } from "@/lib/supabase"

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns A boolean indicating whether the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("table_exists", {
    p_table_name: tableName,
  })

  if (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }

  return data || false
}

/**
 * Safely executes a database query, checking if the required tables exist first
 * @param requiredTables Array of table names required for the query
 * @param queryFn Function to execute if all tables exist
 * @param fallbackValue Value to return if any table doesn't exist
 * @returns The result of queryFn or fallbackValue
 */
export async function safeQuery<T>(requiredTables: string[], queryFn: () => Promise<T>, fallbackValue: T): Promise<T> {
  // Check if all required tables exist
  for (const table of requiredTables) {
    const exists = await tableExists(table)
    if (!exists) {
      console.warn(`Table ${table} does not exist. Returning fallback value.`)
      return fallbackValue
    }
  }

  // All tables exist, execute the query
  try {
    return await queryFn()
  } catch (error) {
    console.error("Error executing query:", error)
    return fallbackValue
  }
}
