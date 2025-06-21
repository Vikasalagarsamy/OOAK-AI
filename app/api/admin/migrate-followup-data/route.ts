import { createClient } from "@/lib/postgresql-client"
import { NextResponse } from "next/server"

export async function POST() {
  const { query, transaction } = createClient()

  try {
    // First check if both columns exist
    const { data: columns, error: columnsError } = await supabase
      .rpc("exec_sql_with_result", {
        sql_query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lead_followups' 
        AND column_name IN ('followup_type', 'contact_method')
      `,
      })
      .catch(() => ({ data: null, error: { message: "Failed to check columns" } }))

    if (columnsError) {
      // Try an alternative approach
      const { data, error } = await query(`SELECT ${params} FROM ${table}`).limit(1)

      // If we can't even check the columns, return success to avoid blocking
      if (error) {
        return NextResponse.json({ message: "Could not verify columns, skipping migration" })
      }
    }

    // If we don't have both columns, we can't migrate
    if (!columns || columns.length < 2) {
      return NextResponse.json({ message: "Both columns don't exist, no migration needed" })
    }

    // Update records where contact_method is null but followup_type has data
    const { error: updateError } = await supabase
      .rpc("exec_sql", {
        sql_query: `
        UPDATE lead_followups
        SET contact_method = followup_type
        WHERE contact_method IS NULL AND followup_type IS NOT NULL
      `,
      })
      .catch(() => ({ error: { message: "Failed to update records" } }))

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Successfully migrated data from followup_type to contact_method" })
  } catch (error) {
    console.error("Error in migrate-followup-data:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
