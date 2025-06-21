import { pool } from '@/lib/postgresql-client'
import { type NextRequest, NextResponse } from "next/server"

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  try {
    const { table } = await request.json()

    if (!table) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const client = await pool.connect()

    try {
      // Get comprehensive table information from PostgreSQL information_schema
      const tableInfoQuery = `
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale
        FROM information_schema.columns c
        WHERE c.table_name = $1 
          AND c.table_schema = 'public'
        ORDER BY c.ordinal_position
      `

      const result = await client.query(tableInfoQuery, [table])

      if (result.rows.length === 0) {
        return NextResponse.json({
          error: `Table '${table}' not found in public schema`
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        table_name: table,
        columns: result.rows,
        metadata: {
          database: "PostgreSQL localhost:5432",
          source: "Direct PostgreSQL Admin",
          timestamp: new Date().toISOString(),
          column_count: result.rows.length
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error("Error in check-table-columns API route:", error)
    return NextResponse.json({
      error: error.message || "An unexpected error occurred"
    }, { status: 500 })
  }
}
