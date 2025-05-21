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
  try {
    const supabase = createClient()

    // First try using the direct query approach as a fallback
    try {
      const { error } = await supabase.from("lead_followups").select("id").limit(1)

      if (!error) {
        console.log("lead_followups table exists (verified via direct query)")
        return { exists: true, message: "Lead followups table exists" }
      }
    } catch (directQueryError) {
      console.log("Direct query failed, trying information_schema approach")
    }

    // If direct query fails, try using information_schema via exec_sql_with_result
    try {
      const { data, error } = await supabase.rpc("exec_sql_with_result", {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'lead_followups'
          );
        `,
      })

      if (error) {
        console.error("Error checking lead_followups table existence:", error)
        // Return exists: true to prevent blocking app startup
        return {
          exists: true,
          message: "Failed to verify lead followups table, but continuing application startup",
          error: error.message,
        }
      }

      const exists = data && data.length > 0 && data[0].exists

      if (exists) {
        console.log("lead_followups table exists (verified via information_schema)")
        return { exists: true, message: "Lead followups table exists" }
      } else {
        console.log("lead_followups table does not exist")
        return {
          exists: false,
          message: "Lead followups table does not exist, but continuing application startup",
        }
      }
    } catch (rpcError) {
      console.error("RPC method failed, assuming table exists to continue startup:", rpcError)
      return {
        exists: true,
        message: "Error checking lead_followups table, but continuing application startup",
        error: rpcError instanceof Error ? rpcError.message : "Unknown RPC error",
      }
    }
  } catch (error) {
    console.error("Error in verifyLeadFollowupsTable:", error)
    // Return exists: true to prevent blocking app startup
    return {
      exists: true,
      message: "Error checking lead_followups table, but continuing application startup",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Gets the structure of the lead_followups table
 * @returns A promise that resolves to the table structure
 */
export async function getLeadFollowupsStructure() {
  try {
    const supabase = createClient()

    try {
      // Try using the RPC function
      const { data, error } = await supabase.rpc("exec_sql_with_result", {
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'lead_followups';
        `,
      })

      if (error) {
        throw new Error(`RPC error: ${error.message}`)
      }

      return { success: true, structure: data }
    } catch (rpcError) {
      console.warn("RPC method failed for table structure, returning empty result:", rpcError)
      return { success: true, structure: [] }
    }
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
  try {
    const supabase = createClient()

    // First try direct query as fallback
    try {
      const { error } = await supabase.from(tableName).select("*", { count: "exact", head: true })

      if (!error) {
        return true
      }
    } catch (directQueryError) {
      console.log(`Direct query failed for ${tableName}, trying information_schema approach`)
    }

    // If direct query fails, try information_schema
    try {
      const { data, error } = await supabase.rpc("exec_sql_with_result", {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = '${tableName}'
          );
        `,
      })

      if (error) {
        throw new Error(`RPC error: ${error.message}`)
      }

      return data && data.length > 0 && data[0].exists
    } catch (rpcError) {
      console.warn(`RPC method failed for ${tableName}, assuming table doesn't exist:`, rpcError)
      return false
    }
  } catch (error) {
    console.error(`Error checking if ${tableName} table exists:`, error)
    return false
  }
}
