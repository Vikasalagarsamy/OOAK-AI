import { createClient } from "@/lib/supabase/server"

export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Check if the table_exists function exists in the database
    const { data: functionExists, error: functionError } = await supabase
      .rpc("function_exists", { function_name: "table_exists" })
      .single()

    if (functionError || !functionExists) {
      // Fallback method if the function doesn't exist
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_name", tableName)
        .eq("table_schema", "public")
        .single()

      return !error && data !== null
    }

    // Use the table_exists function
    const { data, error } = await supabase.rpc("table_exists", { table_name: tableName }).single()

    return !error && data === true
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}
