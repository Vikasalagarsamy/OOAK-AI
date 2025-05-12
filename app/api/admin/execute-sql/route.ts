import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ success: false, message: "SQL query is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Execute the SQL query
    const { data, error } = await supabase.from("").select(sql).execute()

    if (error) {
      console.error("Error executing SQL:", error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in execute-sql API route:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
