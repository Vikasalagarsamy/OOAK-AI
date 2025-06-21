import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

export async function GET(request: NextRequest, { params }: { params: Promise<any> }) {
  try {
    console.log(`🐘 Getting role ID ${params.id} from PostgreSQL...`)
    const roleId = parseInt(params.id)
    
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    
    const query = `
      SELECT id, title, name, description, department_id, responsibilities, 
             required_skills, is_management, created_at, updated_at, 
             is_system_role, is_admin, permissions
      FROM roles
      WHERE id = $1
    `
    
    const result = await client.query(query, [roleId])
    client.release()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Role ${roleId} retrieved from PostgreSQL`)

    return NextResponse.json({
      success: true,
      role: result.rows[0]
    })

  } catch (error) {
    console.error('❌ Role API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role from database' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<any> }) {
  try {
    console.log(`🐘 Updating role ID ${params.id} in PostgreSQL...`)
    const roleId = parseInt(params.id)
    
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const client = await pool.connect()
    
    // Build dynamic update query
    const updateFields = Object.keys(body)
    const updateValues = Object.values(body)
    updateValues.push(new Date().toISOString()) // updated_at
    updateValues.push(roleId) // for WHERE clause
    
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

    console.log(`✅ Role ${roleId} updated successfully in PostgreSQL`)

    return NextResponse.json({
      success: true,
      role: result.rows[0],
      message: 'Role updated successfully'
    })

  } catch (error) {
    console.error('❌ Update role error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<any> }) {
  try {
    console.log(`🐘 Deleting role ID ${params.id} from PostgreSQL...`)
    const roleId = parseInt(params.id)
    
    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    // Check if there are users with this role
    const checkQuery = `SELECT id FROM user_accounts WHERE role_id = $1 LIMIT 1`
    const checkResult = await client.query(checkQuery, [roleId])

    if (checkResult.rows.length > 0) {
      client.release()
      return NextResponse.json(
        { error: 'Cannot delete role - it is currently assigned to users' },
        { status: 400 }
      )
    }

    // Delete the role
    const deleteQuery = `DELETE FROM roles WHERE id = $1`
    const deleteResult = await client.query(deleteQuery, [roleId])
    client.release()

    if (deleteResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Role ${roleId} deleted successfully from PostgreSQL`)

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    })

  } catch (error) {
    console.error('❌ Delete role error:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
} 