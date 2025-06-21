import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

console.log('🐘 Using PostgreSQL client from lib for suppliers API')

export async function GET(request: NextRequest) {
  try {
    console.log('🏭 [SUPPLIERS] Fetching suppliers via PostgreSQL...')
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search')
    
    let query = 'SELECT * FROM suppliers'
    let params: any[] = []
    let paramCount = 0
    
    if (search) {
      paramCount++
      query += ` WHERE (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }
    
    query += ' ORDER BY created_at DESC'
    
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }

    const client = await pool.connect()
    const result = await client.query(query, params)
    client.release()

    console.log(`✅ [SUPPLIERS] Fetched ${result.rows.length} suppliers via PostgreSQL`)

    return NextResponse.json({
      success: true,
      suppliers: result.rows || [],
      total: result.rows?.length || 0
    })

  } catch (error) {
    console.error('Suppliers API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}
