import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/postgresql-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 [VENDORS] Fetching vendors via PostgreSQL...')
    
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')
    
    let sqlQuery = `
      SELECT *
      FROM vendors
      ${search ? 'WHERE name ILIKE $2' : ''}
      ORDER BY name ASC
      LIMIT $1
    `
    
    const queryParams = search ? [limit, `%${search}%`] : [limit]
    
    const result = await query(sqlQuery, queryParams)
    const vendors = result.rows

    console.log(`✅ [VENDORS] Fetched ${vendors.length} vendors via PostgreSQL`)

    return NextResponse.json({
      success: true,
      vendors: vendors,
      total: vendors.length,
      metadata: {
        limit,
        search,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Vendors API error (PostgreSQL):', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors from database' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏢 [VENDORS] Creating vendor via PostgreSQL...')
    
    const body = await request.json()
    
    // Insert vendor and return the created record
    const result = await query(`
      INSERT INTO vendors (
        name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        country,
        postal_code,
        vendor_type,
        status,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      )
      RETURNING *
    `, [
      body.name,
      body.contact_person,
      body.email,
      body.phone,
      body.address,
      body.city,
      body.state,
      body.country,
      body.postal_code,
      body.vendor_type,
      body.status || 'active'
    ])

    const vendor = result.rows[0]

    console.log(`✅ [VENDORS] Created vendor: ${vendor.name} via PostgreSQL`)

    return NextResponse.json({
      success: true,
      vendor,
      message: 'Vendor created successfully'
    })

  } catch (error) {
    console.error('❌ Create vendor error (PostgreSQL):', error)
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
} 