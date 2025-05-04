"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Checks which lead source column exists in the leads table
 * @returns The name of the lead source column that exists, or null if neither exists
 */
export async function getLeadSourceColumnName(): Promise<string | null> {
  const supabase = createClient()

  try {
    // Use a raw SQL query to check if the column exists
    const { data, error } = await supabase.rpc("column_exists", {
      table_name: "leads",
      column_name: "lead_source",
    })

    if (error) {
      console.error("Error checking column with RPC:", error)

      // Fallback to direct SQL query
      const { data: result, error: sqlError } = await supabase.from("leads").select("lead_source").limit(1)

      if (sqlError) {
        // If we get a specific error about the column not existing
        if (sqlError.message.includes("column") && sqlError.message.includes("does not exist")) {
          return null
        }
        throw sqlError
      }

      // If we got here, the column exists
      return "lead_source"
    }

    return data ? "lead_source" : null
  } catch (error) {
    console.error("Error checking schema:", error)
    return null
  }
}

/**
 * Checks if the lead_source column exists in the leads table
 * @returns Boolean indicating if the lead_source column exists
 */
export async function checkLeadSourceColumn(): Promise<boolean> {
  try {
    // Try a simpler approach - just query the leads table directly
    const supabase = createClient()

    // First try to use the column_exists RPC function if it exists
    try {
      const { data, error } = await supabase.rpc("column_exists", {
        table_name: "leads",
        column_name: "lead_source",
      })

      if (!error) {
        return !!data
      }
    } catch (rpcError) {
      console.log("RPC method failed, trying direct query:", rpcError)
    }

    // If RPC fails, try a direct query to the leads table
    try {
      const { data, error } = await supabase.from("leads").select("lead_source").limit(1)

      // If this succeeds, the column exists
      if (!error) {
        return true
      }

      // If we get a specific error about the column not existing
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        return false
      }

      throw error
    } catch (queryError) {
      console.error("Error with direct query:", queryError)

      // Last resort - try a raw SQL query
      try {
        const { data, error } = await supabase.rpc("exec_sql", {
          sql: `
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
                AND table_name = 'leads'
                AND column_name = 'lead_source'
            );
          `,
        })

        if (error) {
          console.error("Error with raw SQL query:", error)
          return false
        }

        return !!data
      } catch (sqlError) {
        console.error("Error with raw SQL fallback:", sqlError)
        return false
      }
    }
  } catch (error) {
    console.error("Error checking schema:", error)
    return false
  }
}

/**
 * Adds the lead_source column to the leads table if it doesn't exist
 * @returns Boolean indicating success
 */
export async function addLeadSourceColumn(): Promise<boolean> {
  const supabase = createClient()

  try {
    // First check if the column already exists
    const columnExists = await checkLeadSourceColumn()
    if (columnExists) {
      return true // Column already exists
    }

    // Try using the RPC function first
    try {
      const { error } = await supabase.rpc("add_lead_source_column")
      if (!error) {
        return true
      }
    } catch (rpcError) {
      console.log("RPC method failed, trying direct SQL:", rpcError)
    }

    // If RPC fails, try using a direct SQL approach
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql: `ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT;`,
      })

      if (error) {
        console.error("Error adding column with SQL:", error)
        return false
      }

      return true
    } catch (sqlError) {
      console.error("Error with SQL fallback:", sqlError)

      // Final fallback - try a different approach
      try {
        // Create a temporary function to add the column
        const { error: createError } = await supabase.rpc("exec_sql", {
          sql: `
            CREATE OR REPLACE FUNCTION temp_add_lead_source()
            RETURNS boolean AS $$
            BEGIN
              ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT;
              RETURN true;
            EXCEPTION WHEN OTHERS THEN
              RAISE NOTICE 'Error adding column: %', SQLERRM;
              RETURN false;
            END;
            $$ LANGUAGE plpgsql;
          `,
        })

        if (createError) {
          console.error("Error creating temp function:", createError)
          return false
        }

        // Execute the function
        const { data, error } = await supabase.rpc("temp_add_lead_source")

        // Clean up
        await supabase
          .rpc("exec_sql", {
            sql: `DROP FUNCTION IF EXISTS temp_add_lead_source();`,
          })
          .catch((e) => console.error("Error dropping temp function:", e))

        if (error) {
          console.error("Error executing temp function:", error)
          return false
        }

        return !!data
      } catch (finalError) {
        console.error("All attempts to add column failed:", finalError)
        return false
      }
    }
  } catch (error) {
    console.error("Error adding lead_source column:", error)
    return false
  }
}
