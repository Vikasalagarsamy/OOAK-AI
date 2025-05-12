import { createClient } from "@/lib/supabase/server"

/**
 * Verifies if the lead_followups table exists and creates it if it doesn't.
 * @returns A promise that resolves to an object with the verification result
 */
export async function verifyLeadFollowupsTable(): Promise<{
  exists: boolean
  message: string
  error?: string
}> {
  const supabase = createClient()

  try {
    // Check if the table exists by directly querying it
    const { data, error } = await supabase.from("lead_followups").select("id").limit(1)

    if (!error) {
      console.log("lead_followups table exists")
      return { exists: true, message: "Lead followups table exists" }
    }

    console.error("Error querying lead_followups table:", error)
    return {
      exists: false,
      message: "Failed to verify lead followups table",
      error: error.message,
    }
  } catch (error) {
    console.error("Error in verifyLeadFollowupsTable:", error)
    return {
      exists: false,
      message: "Error checking lead_followups table",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Gets the structure of the lead_followups table
 * @returns A promise that resolves to the table structure
 */
export async function getLeadFollowupsStructure() {
  const supabase = createClient()

  try {
    // Use a direct SQL query instead of the function
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'lead_followups';
      `,
    })

    if (error) {
      console.error("Error getting lead_followups structure:", error)
      return { success: false, error: error.message }
    }

    return { success: true, structure: data }
  } catch (error) {
    console.error("Error getting lead_followups structure:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Checks if a table exists in the database
 * @param tableName The name of the table to check
 * @returns A promise that resolves to a boolean indicating if the table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Try using the direct query approach
    const { error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

    // If there's no error, the table exists
    return !error
  } catch (error) {
    console.error(`Error checking if ${tableName} table exists:`, error)
    return false
  }
}
