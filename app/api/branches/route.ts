import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

console.log('🐘 Using PostgreSQL client from lib for branches API')

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting branches data from PostgreSQL...')
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const limit = parseInt(searchParams.get('limit') || '100')
    const companyId = searchParams.get('company_id')
    const search = searchParams.get('search')
    
    // Build PostgreSQL query with company join
    let query = `
      SELECT 
        b.*,
        c.id as company_id,
        c.name as company_name
      FROM branches b
      LEFT JOIN companies c ON b.company_id = c.id
    `
    let whereConditions: string[] = []
    let params: any[] = []
    let paramCount = 0
    
    // Apply filters
    if (companyId) {
      paramCount++
      whereConditions.push(`b.company_id = $${paramCount}`)
      params.push(parseInt(companyId))
    }
    
    if (search) {
      paramCount++
      whereConditions.push(`(b.name ILIKE $${paramCount} OR b.address ILIKE $${paramCount})`)
      params.push(`%${search}%`)
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`
    }
    
    // Add ordering
    query += ' ORDER BY b.created_at DESC'
    
    // Apply limit
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }

    const client = await pool.connect()
    const result = await client.query(query, params)
    client.release()

    console.log(`✅ Branches data from PostgreSQL: ${result.rows.length} branches`)

    return NextResponse.json({
      success: true,
      branches: result.rows || [],
      total: result.rows?.length || 0,
      metadata: {
        limit,
        companyId,
        search,
        timestamp: new Date().toISOString(),
        note: "Live data from PostgreSQL database",
        source: "Direct PostgreSQL"
      }
    })

  } catch (error) {
    console.error('Branches API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Creating branch in PostgreSQL...')
    const body = await request.json()
    
    const client = await pool.connect()
    
    // Insert branch with returning clause and company join
    const query = `
      INSERT INTO branches (name, company_id, address, phone, email, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    
    const values = [
      body.name,
      body.company_id,
      body.address,
      body.phone,
      body.email,
      new Date().toISOString(),
      new Date().toISOString()    ]
    
    const result = await client.query(query, values)
    client.release()

    console.log('✅ Branch created successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      branch: result.rows[0],
      message: 'Branch created successfully'
    })

  } catch (error) {
    console.error('Create branch error:', error)
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    )
  }
}
