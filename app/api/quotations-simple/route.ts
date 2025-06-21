import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET() {
  try {
    console.log('🐘 Getting quotations from PostgreSQL...')
    
    const client = await pool.connect()
    
    // Get quotations for employee ID 6 (hardcoded in original)
    const query = `
      SELECT *
      FROM quotations 
      WHERE created_by = $1
      ORDER BY created_at DESC
      LIMIT 50
    `
    
    const result = await client.query(query, [6])
    client.release()
    
    console.log(`✅ Quotations data from PostgreSQL: ${result.rows.length} quotations`)
    
    return NextResponse.json({ 
      success: true, 
      quotations: result.rows || [],
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        total: result.rows.length
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error in quotations-simple API:', error)
    return NextResponse.json({ 
      error: "Failed to fetch quotations",
      details: error.message 
    }, { status: 500 })
  }
}
