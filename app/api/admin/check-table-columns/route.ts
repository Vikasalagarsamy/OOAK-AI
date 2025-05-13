import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { table } = await request.json()

    if (!table) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const supabase = createClient()

    // Use a stored procedure to get the columns if available
    const { data, error } = await supabase.rpc("get_table_columns", { table_name: table }).catch(() => {
      // If the function doesn't exist, we'll return an error
      return { data: null, error: { message: "get_table_columns function does not exist" } }
    })

    if (error) {
      // Try an alternative approach - use a direct query to information_schema
      // This is done through a custom SQL function that we'll create
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
        RETURNS SETOF text AS $$
        BEGIN
          RETURN QUERY SELECT column_name::text
          FROM information_schema.columns
          WHERE table_name = $1;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      // Try to create the function
      const { error: createError } = await supabase.rpc("exec_sql", { sql: createFunctionSQL }).catch(() => {
        return { error: { message: "Could not create get_table_columns function" } }
      })

      if (createError) {
        console.error("Error creating get_table_columns function:", createError)
        return NextResponse.json({ error: "Could not check table columns" }, { status: 500 })
      }

      // Now try to use the function
      const { data: columnsData, error: columnsError } = await supabase.rpc("get_table_columns", { table_name: table })

      if (columnsError) {
        console.error("Error getting table columns:", columnsError)
        return NextResponse.json({ error: "Could not retrieve table columns" }, { status: 500 })
      }

      return NextResponse.json({ columns: columnsData })
    }

    return NextResponse.json({ columns: data })
  } catch (error) {
    console.error("Error in check-table-columns API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
