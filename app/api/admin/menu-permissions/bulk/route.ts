import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Using centralized PostgreSQL client

// POST - Bulk update permissions for a role
export async function POST(request: NextRequest) {
  try {
    console.log('📦 Bulk updating menu permissions...')
    
    const body = await request.json()
    const { roleId, permissions, action } = body
    
    if (!roleId || !permissions || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: roleId, permissions, action' },
        { status: 400 }
      )
    }
    
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')
      
      if (action === 'replace') {
        // Delete all existing permissions for this role
        const deleteQuery = `DELETE FROM role_menu_permissions WHERE role_id = $1`
        await client.query(deleteQuery, [roleId])
        console.log(`🗑️ Cleared existing permissions for role ${roleId}`)
      }
      
      // Insert/Update new permissions
      let insertedCount = 0
      let updatedCount = 0
      
      for (const menuStringId of Object.keys(permissions)) {
        const permission = permissions[menuStringId]
        
        if (action === 'replace') {
          // Insert new permission
          const insertQuery = `
            INSERT INTO role_menu_permissions 
            (role_id, menu_string_id, can_view, can_add, can_edit, can_delete, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          `
          await client.query(insertQuery, [
            roleId,
            menuStringId,
            permission.can_view,
            permission.can_add,
            permission.can_edit,
            permission.can_delete
          ])
          insertedCount++
        } else {
          // Upsert permission (update if exists, insert if not)
          const upsertQuery = `
            INSERT INTO role_menu_permissions 
            (role_id, menu_string_id, can_view, can_add, can_edit, can_delete, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (role_id, menu_string_id) 
            DO UPDATE SET 
              can_view = EXCLUDED.can_view,
              can_add = EXCLUDED.can_add,
              can_edit = EXCLUDED.can_edit,
              can_delete = EXCLUDED.can_delete,
              updated_at = NOW()
          `
          const result = await client.query(upsertQuery, [
            roleId,
            menuStringId,
            permission.can_view,
            permission.can_add,
            permission.can_edit,
            permission.can_delete
          ])
          
          if (result.rowCount === 1) {
            insertedCount++
          } else {
            updatedCount++
          }
        }
      }
      
      await client.query('COMMIT')
      
      console.log(`✅ Bulk operation completed for role ${roleId}: ${insertedCount} inserted, ${updatedCount} updated`)
      
      return NextResponse.json({
        success: true,
        message: `Bulk ${action} completed successfully`,
        data: {
          roleId,
          action,
          insertedCount,
          updatedCount,
          totalPermissions: Object.keys(permissions).length
        }
      })
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
    
  } catch (error: any) {
    console.error('❌ Error in bulk permissions update:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to bulk update permissions', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE - Clear all permissions for a role
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')
    
    if (!roleId) {
      return NextResponse.json(
        { success: false, error: 'Missing roleId' },
        { status: 400 }
      )
    }
    
    const client = await pool.connect()
    
    const deleteQuery = `DELETE FROM role_menu_permissions WHERE role_id = $1`
    const result = await client.query(deleteQuery, [roleId])
    
    client.release()
    
    console.log(`🗑️ Cleared all permissions for role ${roleId}: ${result.rowCount} permissions removed`)
    
    return NextResponse.json({
      success: true,
      message: 'All permissions cleared successfully',
      deletedCount: result.rowCount
    })
    
  } catch (error: any) {
    console.error('❌ Error clearing permissions:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear permissions', 
        details: error.message 
      },
      { status: 500 }
    )
  }
} 