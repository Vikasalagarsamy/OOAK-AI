"use server"

import { createClient } from "@/lib/supabase/server"

export async function fixLeadFollowupsTable(): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    // First, let's check if the lead_followups table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from("lead_followups")
      .select("id")
      .limit(1)
      .catch(() => ({ data: null, error: { message: "Table does not exist" } }))

    if (tableCheckError) {
      console.log("Table might not exist, attempting to create it")

      // Try to create the table using a stored procedure if available
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS lead_followups (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER NOT NULL,
          scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
          completed_at TIMESTAMP WITH TIME ZONE,
          contact_method TEXT NOT NULL DEFAULT 'phone',
          interaction_summary TEXT,
          status TEXT NOT NULL DEFAULT 'scheduled',
          outcome TEXT,
          notes TEXT,
          priority TEXT NOT NULL DEFAULT 'medium',
          created_by TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_by TEXT,
          updated_at TIMESTAMP WITH TIME ZONE,
          completed_by TEXT,
          duration_minutes INTEGER,
          follow_up_required BOOLEAN DEFAULT FALSE,
          next_follow_up_date TIMESTAMP WITH TIME ZONE
        );
      `

      // Try to use exec_sql function if it exists
      const { error: execError } = await supabase
        .rpc("exec_sql", { sql: createTableSQL })
        .catch(() => ({ error: { message: "Function does not exist" } }))

      if (execError) {
        console.log("exec_sql function might not exist, trying alternative approaches")

        // Try to create the function first
        try {
          // Use a direct SQL query through a custom endpoint
          const response = await fetch("/api/admin/execute-sql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sql: createTableSQL,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            return {
              success: false,
              message: `Failed to create lead_followups table: ${errorData.error}`,
            }
          }

          console.log("Successfully created lead_followups table")
        } catch (apiError) {
          console.error("Error using API endpoint:", apiError)

          // As a last resort, try to use any available database utility
          try {
            // Try to use any available database utility function
            const { error: utilError } = await supabase
              .rpc("create_table_if_not_exists", {
                table_name: "lead_followups",
                table_definition: createTableSQL,
              })
              .catch(() => ({ error: { message: "Function does not exist" } }))

            if (utilError) {
              return {
                success: false,
                message:
                  "Could not create lead_followups table. Please check database permissions or create it manually.",
              }
            }
          } catch (utilsError) {
            console.error("Error using database utils:", utilsError)
            return {
              success: false,
              message: "Failed to create lead_followups table using all available methods. Please create it manually.",
            }
          }
        }
      }

      // Check if the table was created successfully
      const { error: recheckError } = await supabase.from("lead_followups").select("id").limit(1)

      if (recheckError) {
        return {
          success: false,
          message: "Failed to create or access lead_followups table. Please check database permissions.",
        }
      }
    }

    // Now let's check for the columns
    // We'll use a custom API endpoint for this since we need to execute raw SQL
    try {
      const response = await fetch("/api/admin/check-table-columns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: "lead_followups",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          message: `Failed to check lead_followups columns: ${errorData.error}`,
        }
      }

      const { columns } = await response.json()

      // Check if followup_type exists but contact_method doesn't
      if (columns.includes("followup_type") && !columns.includes("contact_method")) {
        // We need to add contact_method and copy data from followup_type
        const alterSQL = `
          ALTER TABLE lead_followups ADD COLUMN contact_method TEXT;
          UPDATE lead_followups SET contact_method = followup_type;
          ALTER TABLE lead_followups ALTER COLUMN contact_method SET NOT NULL;
        `

        const alterResponse = await fetch("/api/admin/execute-sql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sql: alterSQL,
          }),
        })

        if (!alterResponse.ok) {
          const errorData = await alterResponse.json()
          return {
            success: false,
            message: `Failed to add contact_method column: ${errorData.error}`,
          }
        }

        return {
          success: true,
          message: "Successfully added contact_method column and copied data from followup_type",
        }
      }

      // Check if neither column exists
      if (!columns.includes("followup_type") && !columns.includes("contact_method")) {
        // We need to add contact_method
        const addColumnSQL = `
          ALTER TABLE lead_followups ADD COLUMN contact_method TEXT NOT NULL DEFAULT 'phone';
        `

        const addColumnResponse = await fetch("/api/admin/execute-sql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sql: addColumnSQL,
          }),
        })

        if (!addColumnResponse.ok) {
          const errorData = await addColumnResponse.json()
          return {
            success: false,
            message: `Failed to add contact_method column: ${errorData.error}`,
          }
        }

        return {
          success: true,
          message: "Successfully added contact_method column with default value",
        }
      }

      return {
        success: true,
        message: "Lead followups table structure is already correct",
      }
    } catch (apiError) {
      console.error("Error using API endpoints:", apiError)
      return {
        success: false,
        message: "Failed to check or modify lead_followups table structure. Please check API endpoints.",
      }
    }
  } catch (error) {
    console.error("Error fixing lead_followups table:", error)
    return {
      success: false,
      message:
        typeof error === "object" && error !== null && "message" in error
          ? (error as Error).message
          : "An unexpected error occurred",
    }
  }
}
