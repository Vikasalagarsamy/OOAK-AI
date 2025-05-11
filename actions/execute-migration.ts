"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function executeMigration(): Promise<{
  success: boolean
  message: string
  details?: string[]
}> {
  try {
    const supabase = createClient()
    const notices: string[] = []

    // First, check if the leads table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("table_exists", {
      table_name: "leads",
    })

    if (tableCheckError) {
      console.error("Error checking if leads table exists:", tableCheckError)
      return {
        success: false,
        message: "Failed to check if leads table exists",
        details: [tableCheckError.message],
      }
    }

    if (!tableExists) {
      return {
        success: false,
        message: "The leads table does not exist in the database",
        details: ["Cannot add columns to a non-existent table"],
      }
    }

    // Execute migration using raw SQL with individual steps for better error handling
    const steps = [
      {
        name: "Check and add rejection_reason column",
        sql: `
          DO $$
          DECLARE
            column_exists BOOLEAN;
          BEGIN
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'leads' AND column_name = 'rejection_reason'
            ) INTO column_exists;

            IF NOT column_exists THEN
              ALTER TABLE leads ADD COLUMN rejection_reason TEXT;
              RAISE NOTICE 'Added rejection_reason column to leads table';
            ELSE
              RAISE NOTICE 'rejection_reason column already exists in leads table';
            END IF;
          END $$;
        `,
      },
      {
        name: "Check and add rejected_at column",
        sql: `
          DO $$
          DECLARE
            column_exists BOOLEAN;
          BEGIN
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'leads' AND column_name = 'rejected_at'
            ) INTO column_exists;

            IF NOT column_exists THEN
              ALTER TABLE leads ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
              RAISE NOTICE 'Added rejected_at column to leads table';
            ELSE
              RAISE NOTICE 'rejected_at column already exists in leads table';
            END IF;
          END $$;
        `,
      },
      {
        name: "Check and add rejected_by column",
        sql: `
          DO $$
          DECLARE
            column_exists BOOLEAN;
          BEGIN
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'leads' AND column_name = 'rejected_by'
            ) INTO column_exists;

            IF NOT column_exists THEN
              ALTER TABLE leads ADD COLUMN rejected_by TEXT;
              RAISE NOTICE 'Added rejected_by column to leads table';
            ELSE
              RAISE NOTICE 'rejected_by column already exists in leads table';
            END IF;
          END $$;
        `,
      },
      {
        name: "Create indexes for better performance",
        sql: `
          CREATE INDEX IF NOT EXISTS idx_leads_rejection_reason ON leads (rejection_reason) WHERE rejection_reason IS NOT NULL;
          CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
        `,
      },
    ]

    // Execute each step
    for (const step of steps) {
      try {
        const { error } = await supabase.rpc("exec_sql", { sql_string: step.sql })

        if (error) {
          console.error(`Error executing step "${step.name}":`, error)
          notices.push(`Failed at step "${step.name}": ${error.message}`)
        } else {
          notices.push(`Successfully executed: ${step.name}`)
        }
      } catch (stepError) {
        console.error(`Exception executing step "${step.name}":`, stepError)
        notices.push(`Exception at step "${step.name}": ${stepError}`)
      }
    }

    // Verify the columns were added successfully
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "leads")
      .in("column_name", ["rejection_reason", "rejected_at", "rejected_by"])

    if (columnsError) {
      console.error("Error verifying columns:", columnsError)
      return {
        success: false,
        message: "Migration executed but verification failed",
        details: [...notices, columnsError.message],
      }
    }

    const columnDetails = columns?.map(
      (col) => `${col.column_name} (${col.data_type}, ${col.is_nullable === "YES" ? "nullable" : "not nullable"})`,
    )

    // Revalidate paths that might display rejection reasons
    revalidatePath("/sales/rejected-leads")
    revalidatePath("/sales/my-leads")

    return {
      success: true,
      message: "Migration executed successfully",
      details: [...notices, "Verified columns:", ...(columnDetails || ["No columns found"])],
    }
  } catch (error) {
    console.error("Error executing migration:", error)
    return {
      success: false,
      message: "An unexpected error occurred while executing the migration",
      details: [error.toString()],
    }
  }
}

export async function verifyRejectionColumns(): Promise<{
  success: boolean
  message: string
  columns?: { name: string; exists: boolean; type?: string }[]
}> {
  try {
    const supabase = createClient()

    // Check each column individually
    const columnsToCheck = ["rejection_reason", "rejected_at", "rejected_by"]
    const results = []

    for (const columnName of columnsToCheck) {
      try {
        // Check if column exists
        const { data: exists, error } = await supabase.rpc("column_exists", {
          table_name: "leads",
          column_name: columnName,
        })

        if (error) {
          console.error(`Error checking column ${columnName}:`, error)
          results.push({ name: columnName, exists: false, error: error.message })
          continue
        }

        // If column exists, get its type
        if (exists) {
          const { data: columnInfo, error: typeError } = await supabase
            .from("information_schema.columns")
            .select("data_type")
            .eq("table_name", "leads")
            .eq("column_name", columnName)
            .single()

          if (typeError) {
            results.push({ name: columnName, exists: true, type: "unknown" })
          } else {
            results.push({ name: columnName, exists: true, type: columnInfo?.data_type })
          }
        } else {
          results.push({ name: columnName, exists: false })
        }
      } catch (columnError) {
        console.error(`Exception checking column ${columnName}:`, columnError)
        results.push({ name: columnName, exists: false, error: columnError.toString() })
      }
    }

    const allExist = results.every((col) => col.exists)

    return {
      success: allExist,
      message: allExist
        ? "All rejection columns exist in the leads table"
        : "Some rejection columns are missing from the leads table",
      columns: results,
    }
  } catch (error) {
    console.error("Error verifying rejection columns:", error)
    return {
      success: false,
      message: "An unexpected error occurred while verifying columns",
    }
  }
}
