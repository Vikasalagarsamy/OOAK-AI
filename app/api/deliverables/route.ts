import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET() {
  try {
    console.log('🐘 Getting deliverables from PostgreSQL...')
    
    const client = await pool.connect()
    
    // Fetch all active deliverables
    const query = `
      SELECT *
      FROM deliverables
      WHERE status = $1
      ORDER BY deliverable_name
    `
    
    const result = await client.query(query, [1])
    client.release()
    
    console.log(`✅ Deliverables data from PostgreSQL: ${result.rows.length} deliverables`)

    return NextResponse.json({
      success: true,
      deliverables: result.rows || [],
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        total: result.rows.length
      }
    })

  } catch (error: any) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 