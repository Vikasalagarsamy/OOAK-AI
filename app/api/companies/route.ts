import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

console.log('🐘 Using PostgreSQL client from lib for companies API')

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting companies data from PostgreSQL...')
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')
    
    // Build PostgreSQL query
    let query = 'SELECT * FROM companies'
    let params: any[] = []
    let paramCount = 0
    
    // Apply search filter
    if (search) {
      paramCount++
      query += ` WHERE (name ILIKE $${paramCount} OR company_code ILIKE $${paramCount} OR email ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }
    
    // Add ordering
    query += ' ORDER BY created_at DESC'
    
    // Apply limit
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }

    const client = await pool.connect()
    const result = await client.query(query, params)
    client.release()

    console.log(`✅ Companies data from PostgreSQL: ${result.rows.length} companies`)

    return NextResponse.json({
      success: true,
      companies: result.rows || [],
      total: result.rows?.length || 0,
      metadata: {
        limit,
        search,
        timestamp: new Date().toISOString(),
        note: "Live data from PostgreSQL database",
        source: "Direct PostgreSQL"
      }
    })

  } catch (error) {
    console.error('Companies API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Creating company in PostgreSQL...')
    const body = await request.json()
    
    const client = await pool.connect()
    
    // Insert company with returning clause
    const query = `
      INSERT INTO companies (name, company_code, email, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    
    const values = [
      body.name,
      body.company_code,
      body.email,
      new Date().toISOString(),
      new Date().toISOString()
    ]
    
    const result = await client.query(query, values)
    client.release()

    console.log('✅ Company created successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      company: result.rows[0],
      message: 'Company created successfully'
    })

  } catch (error) {
    console.error('Create company error:', error)
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}
