import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'
import { getCurrentUser } from '@/actions/auth-actions'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting quotations data from PostgreSQL...')
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const clientName = searchParams.get('client')
    
    // Build PostgreSQL query with joins for deliverables and tasks
    let query = `
      SELECT 
        q.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', qd.id,
              'quotation_id', qd.quotation_id,
              'name', qd.name,
              'description', qd.description,
              'price', qd.price
            )
          ) FILTER (WHERE qd.id IS NOT NULL), 
          '[]'
        ) as quotation_deliverables,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', qt.id,
              'quotation_id', qt.quotation_id,
              'task_name', qt.task_name,
              'description', qt.description,
              'status', qt.status
            )
          ) FILTER (WHERE qt.id IS NOT NULL), 
          '[]'
        ) as quotation_tasks
      FROM quotations q
      LEFT JOIN quotation_deliverables qd ON q.id = qd.quotation_id
      LEFT JOIN quotation_tasks qt ON q.id = qt.quotation_id
    `
    
    let whereConditions = [`q.created_by = $1`]
    let params: any[] = [currentUser.id]
    let paramCount = 1
    
    // Apply filters
    if (status) {
      paramCount++
      whereConditions.push(`q.status = $${paramCount}`)
      params.push(status)
    }
    
    if (clientName) {
      paramCount++
      whereConditions.push(`q.client_name ILIKE $${paramCount}`)
      params.push(`%${clientName}%`)
    }
    
    query += ` WHERE ${whereConditions.join(' AND ')}`
    query += ` GROUP BY q.id ORDER BY q.created_at DESC`
    
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }

    const client = await pool.connect()
    const result = await client.query(query, params)
    client.release()

    console.log(`✅ Quotations data from PostgreSQL: ${result.rows.length} quotations`)

    return NextResponse.json({
      success: true,
      quotations: result.rows || [],
      total: result.rows?.length || 0,
      metadata: {
        limit,
        filters: { status, clientName },
        timestamp: new Date().toISOString(),
        source: "Direct PostgreSQL"
      }
    })

  } catch (error) {
    console.error('Quotations API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotations from database' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Creating quotation in PostgreSQL...')
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const client = await pool.connect()

    // Create quotation with real user ID
    const query = `
      INSERT INTO quotations (
        quotation_number, client_name, bride_name, groom_name, mobile, email,
        default_package, total_amount, status, created_by, assigned_to,
        quotation_data, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `

    const values = [
      body.quotation_number,
      body.client_name,
      body.bride_name,
      body.groom_name,
      body.mobile,
      body.email,
      body.default_package,
      body.total_amount,
      body.status || 'draft',
      currentUser.id,
      body.assigned_to || currentUser.id,
      body.quotation_data ? JSON.stringify(body.quotation_data) : null,
      new Date().toISOString(),
      new Date().toISOString()
    ]

    const result = await client.query(query, values)
    client.release()

    console.log('✅ Quotation created successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      quotation: result.rows[0],
      message: 'Quotation created successfully'
    })

  } catch (error) {
    console.error('Create quotation error:', error)
    return NextResponse.json(
      { error: 'Failed to create quotation in database' },
      { status: 500 }
    )
  }
} 