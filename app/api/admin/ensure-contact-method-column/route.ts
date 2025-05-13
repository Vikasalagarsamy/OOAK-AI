import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = createClient()

  try {
    // Try to use the exec_sql function if it exists
    const { error: addColumnError } = await supabase
      .rpc("exec_sql", {
        sql_query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'lead_followups' AND column_name = 'contact_method'
          ) THEN
            ALTER TABLE lead_followups ADD COLUMN contact_method VARCHAR(50);
          END IF;
        END
        $$;
      `,
      })
      .catch(() => ({ error: { message: "Failed to add column using exec_sql" } }))

    if (addColumnError) {
      // If exec_sql fails, we'll try a different approach
      // Check if the column exists by trying to select it
      const { error: columnCheckError } = await supabase.from("lead_followups").select("contact_method").limit(1)

      if (columnCheckError) {
        // Column doesn't exist, but we can't add it directly without raw SQL
        // We'll return a message suggesting a manual fix
        return NextResponse.json({
          message:
            "Could not automatically add contact_method column. Please add it manually or check database permissions.",
        })
      }
    }

    return NextResponse.json({ message: "Contact method column exists or was added successfully" })
  } catch (error) {
    console.error("Error in ensure-contact-method-column:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
