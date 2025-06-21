import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET() {
  try {
    console.log('🐘 Getting services from PostgreSQL...')
    
    const client = await pool.connect()
    
    // Fetch all active services
    const query = `
      SELECT *
      FROM services
      WHERE status = $1
      ORDER BY servicename
    `
    
    const result = await client.query(query, ['Active'])
    client.release()
    
    console.log(`✅ Services data from PostgreSQL: ${result.rows.length} services`)

    return NextResponse.json({
      success: true,
      services: result.rows || [],
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