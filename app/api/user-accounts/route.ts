import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting user accounts from PostgreSQL...')
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    
    const client = await pool.connect()
    
    // Get user accounts with employee and role information using JOIN
    let query = `
      SELECT 
        ua.id,
        ua.username,
        ua.email,
        ua.is_active,
        ua.last_login,
        ua.created_at,
        ua.updated_at,
        ua.employee_id,
        ua.role_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        r.title as role_title
      FROM user_accounts ua
      LEFT JOIN employees e ON ua.employee_id = e.id
      LEFT JOIN roles r ON ua.role_id = r.id
    `
    
    let params: any[] = []
    let paramCount = 0
    
    // Apply search filter
    if (search) {
      paramCount++
      query += ` WHERE (ua.username ILIKE $${paramCount} OR ua.email ILIKE $${paramCount} OR CONCAT(e.first_name, ' ', e.last_name) ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }
    
    // Add ordering and limit
    query += ' ORDER BY ua.created_at DESC'
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }
    
    const result = await client.query(query, params)
    client.release()

    console.log(`✅ User accounts data from PostgreSQL: ${result.rows.length} accounts`)

    return NextResponse.json({
      success: true,
      accounts: result.rows || [],
      total: result.rows?.length || 0,
      metadata: {
        limit,
        search,
        timestamp: new Date().toISOString(),
        source: "Direct PostgreSQL"
      }
    })

  } catch (error) {
    console.error('❌ User accounts API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user accounts from database' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Creating user account in PostgreSQL...')
    const body = await request.json()
    
    const client = await pool.connect()
    
    // Insert user account with returning clause
    const query = `
      INSERT INTO user_accounts (employee_id, role_id, username, email, password_hash, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    
    const values = [
      body.employee_id,
      body.role_id,
      body.username,
      body.email,
      body.password_hash,
      body.is_active !== undefined ? body.is_active : true,
      new Date().toISOString(),
      new Date().toISOString()
    ]
    
    const result = await client.query(query, values)
    client.release()

    console.log('✅ User account created successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      account: result.rows[0],
      message: 'User account created successfully'
    })

  } catch (error) {
    console.error('❌ Create user account error:', error)
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    )
  }
} 