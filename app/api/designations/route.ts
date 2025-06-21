import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest) {
  try {
    console.log('🐘 Getting designations from PostgreSQL...')
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const departmentId = searchParams.get('department_id')
    
    const client = await pool.connect()
    
    // Build PostgreSQL query with JOIN for departments
    let query = `
      SELECT 
        d.id,
        d.name,
        d.description,
        d.department_id,
        d.created_at,
        d.updated_at,
        dept.id as "departments.id",
        dept.name as "departments.name"
      FROM designations d
      LEFT JOIN departments dept ON d.department_id = dept.id
    `
    let params: any[] = []
    let paramCount = 0
    let whereClause = ''
    
    // Apply search filter
    if (search) {
      paramCount++
      whereClause += `d.name ILIKE $${paramCount}`
      params.push(`%${search}%`)
    }
    
    // Apply department filter
    if (departmentId) {
      paramCount++
      if (whereClause) {
        whereClause += ' AND '
      }
      whereClause += `d.department_id = $${paramCount}`
      params.push(parseInt(departmentId))
    }
    
    if (whereClause) {
      query += ` WHERE ${whereClause}`
    }
    
    // Add ordering and limit
    query += ' ORDER BY d.name ASC'
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      params.push(limit)
    }

    const result = await client.query(query, params)
    client.release()

    // Transform the results to match the expected format
    const designations = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      department_id: row.department_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      departments: row['departments.id'] ? {
        id: row['departments.id'],
        name: row['departments.name']
      } : null
    }))

    console.log(`✅ Designations data from PostgreSQL: ${designations.length} designations`)

    return NextResponse.json({
      success: true,
      designations: designations || [],
      total: designations?.length || 0,
      metadata: {
        limit,
        search,
        departmentId,
        timestamp: new Date().toISOString(),
        source: "Direct PostgreSQL"
      }
    })

  } catch (error: any) {
    console.error('❌ Designations API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch designations from database', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🐘 Creating designation in PostgreSQL...')
    const body = await request.json()
    const { name, description, department_id } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Designation name is required' },
        { status: 400 }
      )
    }

    if (!department_id) {
      return NextResponse.json(
        { error: 'Department is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    // Insert designation with returning clause and join department data
    const query = `
      WITH inserted AS (
        INSERT INTO designations (name, description, department_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      )
      SELECT 
        i.*,
        d.id as "departments.id",
        d.name as "departments.name"
      FROM inserted i
      LEFT JOIN departments d ON i.department_id = d.id
    `
    
    const values = [
      name.trim(),
      description?.trim() || '',
      parseInt(department_id),
      new Date().toISOString(),
      new Date().toISOString()
    ]
    
    const result = await client.query(query, values)
    client.release()

    // Transform the result to match expected format
    const designation = {
      ...result.rows[0],
      departments: result.rows[0]['departments.id'] ? {
        id: result.rows[0]['departments.id'],
        name: result.rows[0]['departments.name']
      } : null
    }
    
    // Remove the raw department fields
    delete designation['departments.id']
    delete designation['departments.name']

    console.log('✅ Designation created successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      designation: designation,
      message: 'Designation added successfully'
    })

  } catch (error: any) {
    console.error('❌ Designation creation error:', error)
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A designation with this name already exists in this department' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create designation', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🐘 Updating designation in PostgreSQL...')
    const body = await request.json()
    const { id, name, description, department_id } = body

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Designation ID and name are required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    const query = `
      WITH updated AS (
        UPDATE designations 
        SET name = $1, description = $2, department_id = $3, updated_at = $4
        WHERE id = $5
        RETURNING *
      )
      SELECT 
        u.*,
        d.id as "departments.id",
        d.name as "departments.name"
      FROM updated u
      LEFT JOIN departments d ON u.department_id = d.id
    `
    
    const values = [
      name.trim(),
      description?.trim() || '',
      department_id ? parseInt(department_id) : null,
      new Date().toISOString(),
      id
    ]
    
    const result = await client.query(query, values)
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Designation not found' },
        { status: 404 }
      )
    }

    // Transform the result to match expected format
    const designation = {
      ...result.rows[0],
      departments: result.rows[0]['departments.id'] ? {
        id: result.rows[0]['departments.id'],
        name: result.rows[0]['departments.name']
      } : null
    }
    
    // Remove the raw department fields
    delete designation['departments.id']
    delete designation['departments.name']

    console.log('✅ Designation updated successfully in PostgreSQL')

    return NextResponse.json({
      success: true,
      designation: designation,
      message: 'Designation updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Designation update error:', error)
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A designation with this name already exists in this department' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update designation', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🐘 Deleting designation from PostgreSQL...')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Designation ID is required' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    const query = `DELETE FROM designations WHERE id = $1`
    const result = await client.query(query, [parseInt(id)])
    client.release()

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Designation not found' },
        { status: 404 }
      )
    }

    console.log('✅ Designation deleted successfully from PostgreSQL')

    return NextResponse.json({
      success: true,
      message: 'Designation deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Designation deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete designation', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 