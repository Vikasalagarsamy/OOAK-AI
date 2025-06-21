import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🐘 Getting quotation status from PostgreSQL...')
    
    const quotationId = parseInt(params.id)
    
    if (isNaN(quotationId)) {
      return NextResponse.json(
        { error: 'Invalid quotation ID' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    // Get quotation with latest approval status in a single optimized query
    const query = `
      WITH latest_approval AS (
        SELECT 
          qa.quotation_id,
          qa.approval_status,
          qa.approval_date,
          qa.comments,
          qa.created_at,
          ROW_NUMBER() OVER (PARTITION BY qa.quotation_id ORDER BY qa.created_at DESC) as rn
        FROM quotation_approvals qa
        WHERE qa.quotation_id = $1
      )
      SELECT 
        q.id,
        q.status,
        q.workflow_status,
        q.quotation_number,
        q.slug,
        la.approval_status,
        la.approval_date,
        la.comments
      FROM quotations q
      LEFT JOIN latest_approval la ON q.id = la.quotation_id AND la.rn = 1
      WHERE q.id = $1
    `

    const result = await client.query(query, [quotationId])
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    const quotation = result.rows[0]
    
    console.log(`✅ Quotation status from PostgreSQL: ${quotation.quotation_number}`)

    return NextResponse.json({
      id: quotation.id,
      quotation_number: quotation.quotation_number,
      quotation_slug: quotation.slug || null,
      status: quotation.status || 'draft',
      workflow_status: quotation.workflow_status || 'draft',
      approval_status: quotation.approval_status || 'not_submitted',
      approval_date: quotation.approval_date || null,
      comments: quotation.comments || null,
      metadata: {
        source: "Direct PostgreSQL",
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching quotation status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 