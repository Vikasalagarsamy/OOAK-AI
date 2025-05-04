import { createClient } from "@/lib/supabase"

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Try to count rows in the table (with limit 0)
    const { count, error } = await supabase.from(tableName).select("*", { count: "exact", head: true }).limit(0)

    // If there's no error, the table exists
    return !error
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}
