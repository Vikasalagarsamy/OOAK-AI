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
    // Try a direct approach first - just query the table
    const { data, error } = await supabase.from("lead_followups").select("id").limit(1)

    if (!error) {
      console.log("lead_followups table exists")
      return { exists: true, message: "Lead followups table exists" }
    }

    // If the table doesn't exist, create it
    console.log("lead_followups table doesn't exist, creating it...")

    // Try to create the table using direct SQL
    try {
      // Use a simpler approach with supabase.rpc if available
      try {
        const { error: rpcError } = await supabase.rpc("exec_sql", {
          sql_query: `
            CREATE TABLE IF NOT EXISTS lead_followups (
              id SERIAL PRIMARY KEY,
              lead_id INTEGER NOT NULL,
              followup_type VARCHAR(50) NOT NULL,
              scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
              notes TEXT,
              created_by TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed')),
              completed_at TIMESTAMP WITH TIME ZONE,
              completed_by TEXT,
              outcome TEXT
            );
            
            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS lead_followups_lead_id_idx ON lead_followups(lead_id);
            CREATE INDEX IF NOT EXISTS lead_followups_created_by_idx ON lead_followups(created_by);
            CREATE INDEX IF NOT EXISTS lead_followups_scheduled_at_idx ON lead_followups(scheduled_at);
            CREATE INDEX IF NOT EXISTS lead_followups_status_idx ON lead_followups(status);
          `,
        })

        if (!rpcError) {
          // Check if the table was created
          const checkResult = await supabase.from("lead_followups").select("id").limit(1)
          if (!checkResult.error) {
            return { exists: true, message: "Lead followups table created successfully via RPC" }
          }
        }
      } catch (rpcError) {
        console.log("RPC approach failed, trying alternative method:", rpcError)
        // Continue to the next approach
      }

      // Try using a direct SQL approach
      const { error: createError } = await supabase.from("lead_followups").insert({
        lead_id: -1, // Dummy data that will fail validation
        followup_type: "test",
        scheduled_at: new Date().toISOString(),
        notes: "Test note",
      })

      // If the error is about a constraint violation, the table exists
      if (createError && createError.message.includes("violates")) {
        return { exists: true, message: "Lead followups table exists (verified via constraint violation)" }
      }

      // If the error is about the table not existing, create it manually
      if (createError && createError.message.includes("does not exist")) {
        // Create the table using a direct SQL approach
        // This is a fallback and might not work in all environments
        try {
          // Use fetch to call our API endpoint for executing SQL
          const response = await fetch("/api/admin/execute-sql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sql: `
                CREATE TABLE IF NOT EXISTS lead_followups (
                  id SERIAL PRIMARY KEY,
                  lead_id INTEGER NOT NULL,
                  followup_type VARCHAR(50) NOT NULL,
                  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
                  notes TEXT,
                  created_by TEXT,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed')),
                  completed_at TIMESTAMP WITH TIME ZONE,
                  completed_by TEXT,
                  outcome TEXT
                );
                
                -- Create indexes for better performance
                CREATE INDEX IF NOT EXISTS lead_followups_lead_id_idx ON lead_followups(lead_id);
                CREATE INDEX IF NOT EXISTS lead_followups_created_by_idx ON lead_followups(created_by);
                CREATE INDEX IF NOT EXISTS lead_followups_scheduled_at_idx ON lead_followups(scheduled_at);
                CREATE INDEX IF NOT EXISTS lead_followups_status_idx ON lead_followups(status);
              `,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`API error: ${errorData.message || response.statusText}`)
          }

          // Check if the table was created
          const checkResult = await supabase.from("lead_followups").select("id").limit(1)
          if (!checkResult.error) {
            return { exists: true, message: "Lead followups table created successfully via API" }
          }
        } catch (apiError) {
          console.error("Error creating table via API:", apiError)
          return {
            exists: false,
            message: "Failed to create lead_followups table via API",
            error: apiError instanceof Error ? apiError.message : "Unknown error",
          }
        }
      }

      // Check if the table was created
      const checkResult = await supabase.from("lead_followups").select("id").limit(1)
      if (!checkResult.error) {
        return { exists: true, message: "Lead followups table created successfully" }
      }

      return {
        exists: false,
        message: "Failed to create lead_followups table",
        error: createError ? createError.message : "Unknown error",
      }
    } catch (createError) {
      console.error("Error creating lead_followups table:", createError)
      return {
        exists: false,
        message: "Error creating lead_followups table",
        error: createError instanceof Error ? createError.message : "Unknown error",
      }
    }
  } catch (error) {
    console.error("Error checking if lead_followups table exists:", error)
    return {
      exists: false,
      message: "Error checking if lead_followups table exists",
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
