import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: "SQL query is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Use the Supabase service role client to execute raw SQL
    // This is a simplified approach - in a real app, you'd want to add more security checks
    const { data, error } = await supabase.rpc("exec_sql", { sql }).catch(() => {
      // If exec_sql doesn't exist, we'll return an error
      return { data: null, error: { message: "exec_sql function does not exist" } }
    })

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in execute-sql API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
