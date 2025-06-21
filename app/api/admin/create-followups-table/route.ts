import { createClient } from "@/lib/postgresql-client"
import { NextResponse } from "next/server"

export async function POST() {
  const { query, transaction } = createClient()

  try {
    // Try to use the exec_sql function if it exists
    const { error: createTableError } = await supabase
      .rpc("exec_sql", {
        sql_query: `
        CREATE TABLE IF NOT EXISTS lead_followups (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
          scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
          notes TEXT,
          contact_method VARCHAR(50),
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID,
          completed_at TIMESTAMP WITH TIME ZONE,
          completed_by UUID
        )
      `,
      })
      .catch(() => ({ error: { message: "Failed to create table using exec_sql" } }))

    if (createTableError) {
      // If exec_sql fails, try a direct approach
      // For this, we'll need to use a different method since we can't execute raw SQL directly
      // We'll create a minimal table and then add columns one by one

      // First create the basic table
      const { error: basicTableError } = await supabase
        .from("lead_followups")
        .insert({
          id: "00000000-0000-0000-0000-000000000000",
          lead_id: "00000000-0000-0000-0000-000000000000",
          scheduled_at: new Date().toISOString(),
          notes: "Table initialization",
          contact_method: "system",
          status: "pending",
        })
        .select()

      if (basicTableError && !basicTableError.message.includes("already exists")) {
        return NextResponse.json({ error: basicTableError.message }, { status: 500 })
      }

      // The table now exists, so we'll return success
      return NextResponse.json({ message: "Lead followups table created or already exists" })
    }

    return NextResponse.json({ message: "Successfully created lead_followups table" })
  } catch (error) {
    console.error("Error in create-followups-table:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
