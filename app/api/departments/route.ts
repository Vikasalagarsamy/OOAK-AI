import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting departments from PostgreSQL...')
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    
    const client = await pool.connect()
    
    // Build PostgreSQL query
    let query = `
      SELECT id, name, description, created_at, updated_at
      FROM departments
    `
    let params: any[] = []
    let paramCount = 0
    
    // Apply search filter
    if (search) {
      paramCount++
      query += ` WHERE name ILIKE $${paramCount}`
      params.push(`%${search}%`)
    }
    
    // Add ordering and limit
    query += ' ORDER BY name ASC'
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }

    const result = await client.query(query, params)
    client.release()

    console.log(`✅ Departments data from PostgreSQL: ${result.rows.length} departments`)

    return NextResponse.json({
      success: true,
      departments: result.rows || [],
      total: result.rows?.length || 0,
      metadata: {
        limit,
        search,
        timestamp: new Date().toISOString(),
        source: "Direct PostgreSQL"
      }
    })

  } catch (error: any) {
    console.error('❌ Departments API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch departments from database', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Creating department in PostgreSQL...')
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Department name is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    // Insert department with returning clause
    const query = `
      INSERT INTO departments (name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    
    const values = [
      name.trim(),
      description?.trim() || '',
      new Date().toISOString(),
      new Date().toISOString()
    ]
    
    const result = await client.query(query, values)
    client.release()

    console.log('✅ Department created successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      department: result.rows[0],
      message: 'Department added successfully'
    })

  } catch (error: any) {
    console.error('❌ Department creation error:', error)
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A department with this name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create department', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🐘 Updating department in PostgreSQL...')
    const body = await request.json()
    const { id, name, description } = body

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Department ID and name are required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    const query = `
      UPDATE departments 
      SET name = $1, description = $2, updated_at = $3
      WHERE id = $4
      RETURNING *
    `
    
    const values = [
      name.trim(),
      description?.trim() || '',
      new Date().toISOString(),
      id
    ]
    
    const result = await client.query(query, values)
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    console.log('✅ Department updated successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      department: result.rows[0],
      message: 'Department updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Department update error:', error)
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A department with this name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update department', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🐘 Deleting department from PostgreSQL...')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    const query = `DELETE FROM departments WHERE id = $1`
    const result = await client.query(query, [parseInt(id)])
    client.release()

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    console.log('✅ Department deleted successfully from PostgreSQL')

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Department deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete department', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 