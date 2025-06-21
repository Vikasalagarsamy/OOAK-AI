import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Direct PostgreSQL connection
// Using centralized PostgreSQL client

// GET - Fetch all roles and their menu permissions
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching menu permissions data...')
    
    const client = await pool.connect()
    
    // Get all roles
    const rolesQuery = `
      SELECT id, title, description 
      FROM roles 
      WHERE title NOT IN ('Guest', 'Inactive')
      ORDER BY id
    `
    const rolesResult = await client.query(rolesQuery)
    
    // Get all menu items
    const menusQuery = `
      SELECT id, string_id, name, description, parent_id, icon, path, category
      FROM menu_items 
      WHERE is_visible = true
      ORDER BY sort_order, name
    `
    const menusResult = await client.query(menusQuery)
    
    // Get current permissions
    const permissionsQuery = `
      SELECT 
        rmp.role_id,
        rmp.menu_string_id,
        rmp.can_view,
        rmp.can_add,
        rmp.can_edit,
        rmp.can_delete
      FROM role_menu_permissions rmp
      ORDER BY rmp.role_id, rmp.menu_string_id
    `
    const permissionsResult = await client.query(permissionsQuery)
    
    client.release()
    
    // Organize permissions by role_id and menu_string_id
    const permissionsMap: { [key: string]: any } = {}
    permissionsResult.rows.forEach(perm => {
      const key = `${perm.role_id}_${perm.menu_string_id}`
      permissionsMap[key] = {
        can_view: perm.can_view,
        can_add: perm.can_add,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete
      }
    })
    
    console.log(`✅ Loaded ${rolesResult.rows.length} roles, ${menusResult.rows.length} menus, ${permissionsResult.rows.length} permissions`)
    
    return NextResponse.json({
      success: true,
      data: {
        roles: rolesResult.rows,
        menus: menusResult.rows,
        permissions: permissionsMap
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "Direct PostgreSQL"
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error fetching menu permissions:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch menu permissions', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// POST - Update menu permissions for a role
export async function POST(request: NextRequest) {
  try {
    console.log('💾 Updating menu permissions...')
    
    const body = await request.json()
    const { roleId, menuStringId, permissions } = body
    
    if (!roleId || !menuStringId || !permissions) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: roleId, menuStringId, permissions' },
        { status: 400 }
      )
    }
    
    const client = await pool.connect()
    
    // Check if permission exists
    const existingQuery = `
      SELECT id FROM role_menu_permissions 
      WHERE role_id = $1 AND menu_string_id = $2
    `
    const existingResult = await client.query(existingQuery, [roleId, menuStringId])
    
    if (existingResult.rows.length > 0) {
      // Update existing permission
      const updateQuery = `
        UPDATE role_menu_permissions 
        SET 
          can_view = $3,
          can_add = $4,
          can_edit = $5,
          can_delete = $6,
          updated_at = NOW()
        WHERE role_id = $1 AND menu_string_id = $2
      `
      await client.query(updateQuery, [
        roleId, 
        menuStringId, 
        permissions.can_view, 
        permissions.can_add, 
        permissions.can_edit, 
        permissions.can_delete
      ])
      console.log(`📝 Updated permission for role ${roleId}, menu ${menuStringId}`)
    } else {
      // Insert new permission
      const insertQuery = `
        INSERT INTO role_menu_permissions 
        (role_id, menu_string_id, can_view, can_add, can_edit, can_delete, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `
      await client.query(insertQuery, [
        roleId, 
        menuStringId, 
        permissions.can_view, 
        permissions.can_add, 
        permissions.can_edit, 
        permissions.can_delete
      ])
      console.log(`➕ Created permission for role ${roleId}, menu ${menuStringId}`)
    }
    
    client.release()
    
    return NextResponse.json({
      success: true,
      message: 'Menu permission updated successfully',
      data: {
        roleId,
        menuStringId,
        permissions
      }
    })
    
  } catch (error: any) {
    console.error('❌ Error updating menu permission:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update menu permission', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove menu permission for a role
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')
    const menuStringId = searchParams.get('menuStringId')
    
    if (!roleId || !menuStringId) {
      return NextResponse.json(
        { success: false, error: 'Missing roleId or menuStringId' },
        { status: 400 }
      )
    }
    
    const client = await pool.connect()
    
    const deleteQuery = `
      DELETE FROM role_menu_permissions 
      WHERE role_id = $1 AND menu_string_id = $2
    `
    const result = await client.query(deleteQuery, [roleId, menuStringId])
    
    client.release()
    
    console.log(`🗑️ Removed permission for role ${roleId}, menu ${menuStringId}`)
    
    return NextResponse.json({
      success: true,
      message: 'Menu permission removed successfully',
      deletedCount: result.rowCount
    })
    
  } catch (error: any) {
    console.error('❌ Error removing menu permission:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to remove menu permission', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 