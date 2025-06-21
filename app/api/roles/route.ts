import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting roles data from PostgreSQL...')
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    
    // Build PostgreSQL query
    let query = `
      SELECT id, title, name, description, department_id, responsibilities, 
             required_skills, is_management, created_at, updated_at, 
             is_system_role, is_admin, permissions
      FROM roles
    `
    let params: any[] = []
    let paramCount = 0
    
    // Apply search filter
    if (search) {
      paramCount++
      query += ` WHERE title ILIKE $${paramCount}`
      params.push(`%${search}%`)
    }
    
    // Add ordering and limit
    query += ' ORDER BY title ASC'
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }

    const client = await pool.connect()
    const result = await client.query(query, params)
    client.release()

    console.log(`✅ Roles data from PostgreSQL: ${result.rows.length} roles`)

    return NextResponse.json({
      success: true,
      roles: result.rows || [],
      total: result.rows?.length || 0,
      metadata: {
        limit,
        search,
        timestamp: new Date().toISOString(),
        source: "Direct PostgreSQL"
      }
    })

  } catch (error) {
    console.error('Roles API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles from database' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Creating role in PostgreSQL...')
    const body = await request.json()
    
    const client = await pool.connect()
    
    // Insert role with returning clause
    const query = `
      INSERT INTO roles (title, name, description, department_id, responsibilities, 
                        required_skills, is_management, is_system_role, is_admin, 
                        permissions, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `
    
    const values = [
      body.title,
      body.name,
      body.description,
      body.department_id,
      body.responsibilities,
      body.required_skills,
      body.is_management || false,
      body.is_system_role || false,
      body.is_admin || false,
      body.permissions,
      new Date().toISOString(),
      new Date().toISOString()
    ]
    
    const result = await client.query(query, values)
    client.release()

    console.log('✅ Role created successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      role: result.rows[0],
      message: 'Role created successfully'
    })

  } catch (error) {
    console.error('Create role error:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🐘 Updating role in PostgreSQL...')
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }
    
    const client = await pool.connect()
    
    // Build dynamic update query
    const updateFields = Object.keys(updateData)
    const updateValues = Object.values(updateData)
    updateValues.push(new Date().toISOString()) // updated_at
    updateValues.push(id) // for WHERE clause
    
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ')
    
    const query = `
      UPDATE roles 
      SET ${setClause}, updated_at = $${updateFields.length + 1}
      WHERE id = $${updateFields.length + 2}
      RETURNING *
    `
    
    const result = await client.query(query, updateValues)
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    console.log('✅ Role updated successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      role: result.rows[0],
      message: 'Role updated successfully'
    })

  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
} 