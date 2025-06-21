import { NextResponse } from "next/server"
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from')
    const toDate = searchParams.get('to')

    console.log('🐘 Lead sources report request (PostgreSQL):', { fromDate, toDate })

    const client = await pool.connect()

    try {
      // Build PostgreSQL query with date filters
      let query = `
        SELECT 
          id,
          lead_source,
          status,
          created_at
        FROM leads
        WHERE 1=1
      `
      const params: any[] = []
      let paramCount = 0

      // Apply date filters if provided
      if (fromDate) {
        paramCount++
        query += ` AND created_at >= $${paramCount}`
        params.push(fromDate)
      }
      if (toDate) {
        paramCount++
        query += ` AND created_at <= $${paramCount}`
        params.push(`${toDate}T23:59:59`)
      }

      query += ` ORDER BY created_at DESC`

      const result = await client.query(query, params)
      const data = result.rows

      console.log(`✅ Retrieved ${data.length} leads for source analysis from PostgreSQL`)

      // Process the data for visualization
      const sourceMap = new Map()

      data?.forEach((lead: any) => {
        const sourceName = lead.lead_source || "Unknown"
        
        if (!sourceMap.has(sourceName)) {
          sourceMap.set(sourceName, {
            name: sourceName,
            total: 0,
            statuses: {},
          })
        }

        const sourceData = sourceMap.get(sourceName)
        sourceData.total += 1

        if (!sourceData.statuses[lead.status]) {
          sourceData.statuses[lead.status] = 0
        }
        sourceData.statuses[lead.status] += 1
      })

      const sources = Array.from(sourceMap.values())

      return NextResponse.json({
        sources: sources,
        total_leads: data?.length || 0,
        date_range: {
          from: fromDate,
          to: toDate
        },
        metadata: {
          source: "Direct PostgreSQL",
          timestamp: new Date().toISOString()
        }
      })

    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error("🐘 Error in lead-sources API:", error)
    return NextResponse.json({ 
      error: "An unexpected error occurred", 
      details: error.message 
    }, { status: 500 })
  }
} 