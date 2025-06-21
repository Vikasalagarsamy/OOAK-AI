import { NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: Request) {
  try {
    console.log('🐘 Getting leads data from PostgreSQL...')
    const user = await getCurrentUser()
    
    const client = await pool.connect()
    
    // Get all leads with enriched data in a single optimized query
    const query = `
      SELECT 
        l.id,
        l.lead_number,
        l.client_name,
        l.phone,
        l.email,
        l.lead_source,
        l.status,
        l.created_at,
        l.updated_at,
        l.assigned_to,
        l.company_id,
        l.branch_id,
        l.location,
        -- Employee details
        COALESCE(e.name, 
          CASE 
            WHEN e.first_name IS NOT NULL AND e.last_name IS NOT NULL 
            THEN CONCAT(e.first_name, ' ', e.last_name)
            ELSE CONCAT('Employee #', e.id)
          END
        ) as assigned_to_name,
        -- Company details
        c.name as company_name,
        -- Branch details
        b.name as branch_name
      FROM leads l
      LEFT JOIN employees e ON l.assigned_to = e.id
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN branches b ON l.branch_id = b.id
      ORDER BY l.created_at DESC
    `

    const result = await client.query(query)
    client.release()

    console.log(`✅ Leads data from PostgreSQL: ${result.rows.length} leads`)

    return NextResponse.json({
      success: true,
      data: result.rows,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString(),
        total: result.rows.length
      }
    })

  } catch (error: any) {
    console.error('❌ Leads API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch leads'
    }, { status: 500 })
  }
} 