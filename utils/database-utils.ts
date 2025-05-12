import { createClient } from "@/lib/supabase/server"

export async function ensureTableExists(tableName: string, createTableSQL: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Check if table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("table_exists", { table_name: tableName })

    if (tableCheckError) {
      console.error(`Error checking if ${tableName} table exists:`, tableCheckError)
      // Continue anyway, as the table might exist despite the error
    }

    // If table doesn't exist, create it
    if (tableCheckError || !tableExists) {
      const { error: createTableError } = await supabase.rpc("exec_sql", { sql: createTableSQL })

      if (createTableError) {
        console.error(`Error creating ${tableName} table:`, createTableError)
        return false
      }

      console.log(`Created ${tableName} table successfully`)
      return true
    }

    return true
  } catch (error) {
    console.error(`Unexpected error ensuring ${tableName} table exists:`, error)
    return false
  }
}
