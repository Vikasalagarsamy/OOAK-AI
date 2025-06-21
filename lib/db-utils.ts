import { query, transaction } from "@/lib/postgresql-client"

/**
 * Safely checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns Promise<boolean> True if the table exists, false otherwise
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_name = $1 
         AND table_schema = 'public'`,
      [tableName]
    )

    return result.rows && result.rows.length > 0
  } catch (error) {
    console.error(`Exception checking if table ${tableName} exists:`, error)
    return false
  }
}

/**
 * Safely executes a database query with fallback value if the table doesn't exist
 * @param tables Array of table names that the query depends on
 * @param queryFn Function that executes the query
 * @param fallbackValue Value to return if any of the tables don't exist
 * @returns Promise<T> Result of the query or fallback value
 */
export async function safeQuery<T>(tables: string[], queryFn: () => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    // Check if all required tables exist
    for (const table of tables) {
      const exists = await tableExists(table)
      if (!exists) {
        console.log(`Table ${table} does not exist, returning fallback value`)
        return fallbackValue
      }
    }

    // Execute the query
    return await queryFn()
  } catch (error) {
    console.error("Error in safeQuery:", error)
    return fallbackValue
  }
}
