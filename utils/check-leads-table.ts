import { createClient } from "@/lib/supabase"

/**
 * Checks if the leads table exists in the database
 */
export async function checkLeadsTableExists(): Promise<boolean> {
  try {
    const supabase = createClient()

    // Try to query the leads table
    const { data, error } = await supabase.from("leads").select("id").limit(1)

    // If there's no error, the table exists
    return !error
  } catch (error) {
    console.error("Error checking leads table:", error)
    return false
  }
}
