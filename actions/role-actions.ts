'use server'

import { query, transaction } from '@/lib/postgresql-client'
import { createProtectedAction } from '@/lib/auth-utils'
import { broadcastActivity } from '@/lib/server-sent-events'
import { revalidatePath } from 'next/cache'

// Types
export interface Role {
  id: number
  title: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateRoleData {
  title: string
  description?: string
  is_active?: boolean
}

export interface UpdateRoleData {
  title?: string
  description?: string
  is_active?: boolean
}

export interface RolePermission {
  id: number
  role_id: number
  menu_item_id: number
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

// 📋 Get all roles
export const getRoles = createProtectedAction(async () => {
  console.log('👤 Fetching all roles...')
  
  try {
    const result = await query(
      'SELECT * FROM roles ORDER BY title ASC'
    )

    console.log(`✅ Retrieved ${result.rows.length} roles`)
    return {
      success: true,
      data: result.rows as Role[]
    }

  } catch (error) {
    console.error('❌ Error fetching roles:', error)
    return {
      success: false,
      error: 'Failed to fetch roles'
    }
  }
})

// 📋 Get active roles only
export const getActiveRoles = createProtectedAction(async () => {
  console.log('👤 Fetching active roles...')
  
  try {
    const result = await query(
      'SELECT * FROM roles WHERE is_active = true ORDER BY title ASC'
    )

    console.log(`✅ Retrieved ${result.rows.length} active roles`)
    return {
      success: true,
      data: result.rows as Role[]
    }

  } catch (error) {
    console.error('❌ Error fetching active roles:', error)
    return {
      success: false,
      error: 'Failed to fetch active roles'
    }
  }
})

// 📋 Get role by ID
export const getRole = createProtectedAction(async (id: number) => {
  console.log(`👤 Fetching role with ID: ${id}`)
  
  try {
    const result = await query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'Role not found'
      }
    }

    console.log(`✅ Retrieved role: ${result.rows[0].title}`)
    return {
      success: true,
      data: result.rows[0] as Role
    }

  } catch (error) {
    console.error('❌ Error fetching role:', error)
    return {
      success: false,
      error: 'Failed to fetch role'
    }
  }
})

// 📋 Get roles with user counts
export const getRolesWithCounts = createProtectedAction(async () => {
  console.log('👤 Fetching roles with user counts...')
  
  try {
    const result = await query(`
      SELECT 
        r.*,
        COUNT(e.id) as user_count
      FROM roles r
      LEFT JOIN employees e ON r.id = e.role_id AND e.is_active = true
      GROUP BY r.id, r.title, r.description, r.is_active, r.created_at, r.updated_at
      ORDER BY r.title ASC
    `)

    console.log(`✅ Retrieved ${result.rows.length} roles with counts`)
    return {
      success: true,
      data: result.rows
    }

  } catch (error) {
    console.error('❌ Error fetching roles with counts:', error)
    return {
      success: false,
      error: 'Failed to fetch roles with counts'
    }
  }
})

// ➕ Create new role
export const createRole = createProtectedAction(async (roleData: CreateRoleData, user: any) => {
  console.log(`👤 Creating new role: ${roleData.title}`)
  
  try {
    return await transaction(async (client) => {
      // Check if role title already exists
      const existingResult = await client.query(
        'SELECT id FROM roles WHERE LOWER(title) = LOWER($1)',
        [roleData.title]
      )

      if (existingResult.rows.length > 0) {
        throw new Error('Role title already exists')
      }

      // Create role
      const roleResult = await client.query(
        `INSERT INTO roles (title, description, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          roleData.title.trim(),
          roleData.description?.trim() || null,
          roleData.is_active !== false // Default to true
        ]
      )

      const newRole = roleResult.rows[0] as Role

      // Initialize default permissions for the new role if menu items exist
      try {
        const menuItemsResult = await client.query(
          'SELECT id FROM menu_items WHERE parent_id IS NULL LIMIT 1'
        )

        if (menuItemsResult.rows.length > 0) {
          const dashboardMenuId = menuItemsResult.rows[0].id
          
          await client.query(
            `INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
             VALUES ($1, $2, true, false, false, false)`,
            [newRole.id, dashboardMenuId]
          )
          
          console.log('✅ Default permissions set for new role')
        }
      } catch (permError) {
        console.warn('⚠️ Could not set default permissions (menu tables may not exist):', permError)
        // Continue anyway, as the role was created successfully
      }

      // Log activity
      await client.query(
        `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          user.id,
          user.name,
          'CREATE',
          'role',
          newRole.id,
          `Created role: ${newRole.title}`
        ]
      )

      console.log(`✅ Created role: ${newRole.title} (ID: ${newRole.id})`)
      return { success: true, data: newRole }
    })

  } catch (error: any) {
    console.error('❌ Error creating role:', error)
    return {
      success: false,
      error: error.message || 'Failed to create role'
    }
  } finally {
    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Role Created',
      description: `${roleData.title} role was created`,
      timestamp: 'Just now',
      type: 'role',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    revalidatePath('/admin/roles')
    revalidatePath('/dashboard')
  }
})

// ✏️ Update role
export const updateRole = createProtectedAction(async (id: number, updateData: UpdateRoleData, user: any) => {
  console.log(`👤 Updating role ID: ${id}`)
  
  try {
    // Get current role data
    const currentResult = await query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    )

    if (currentResult.rows.length === 0) {
      return {
        success: false,
        error: 'Role not found'
      }
    }

    const currentRole = currentResult.rows[0]

    // Check title uniqueness if being updated
    if (updateData.title && updateData.title.toLowerCase() !== currentRole.title.toLowerCase()) {
      const existingResult = await query(
        'SELECT id FROM roles WHERE LOWER(title) = LOWER($1) AND id != $2',
        [updateData.title, id]
      )

      if (existingResult.rows.length > 0) {
        return {
          success: false,
          error: 'Role title already exists'
        }
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`)
        values.push(value)
        paramCount++
      }
    })

    if (updates.length === 0) {
      return {
        success: false,
        error: 'No updates provided'
      }
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const updateQuery = `
      UPDATE roles 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await query(updateQuery, values)
    const updatedRole = result.rows[0] as Role

    // Log activity
    await query(
      `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        user.id,
        user.name,
        'UPDATE',
        'role',
        updatedRole.id,
        `Updated role: ${updatedRole.title}`
      ]
    )

    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Role Updated',
      description: `${updatedRole.title} role was updated`,
      timestamp: 'Just now',
      type: 'role',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    console.log(`✅ Updated role: ${updatedRole.title}`)
    
    revalidatePath('/admin/roles')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedRole
    }

  } catch (error) {
    console.error('❌ Error updating role:', error)
    return {
      success: false,
      error: 'Failed to update role'
    }
  }
})

// 🗑️ Delete role
export const deleteRole = createProtectedAction(async (id: number, user: any) => {
  console.log(`👤 Deleting role ID: ${id}`)
  
  try {
    return await transaction(async (client) => {
      // Get role info before deletion
      const roleResult = await client.query(
        'SELECT * FROM roles WHERE id = $1',
        [id]
      )

      if (roleResult.rows.length === 0) {
        throw new Error('Role not found')
      }

      const role = roleResult.rows[0]

      // Check for dependencies (users assigned to this role)
      const usersResult = await client.query(
        'SELECT COUNT(*) as count FROM employees WHERE role_id = $1 AND is_active = true',
        [id]
      )

      const userCount = parseInt(usersResult.rows[0].count)
      if (userCount > 0) {
        throw new Error(`Cannot delete role. It has ${userCount} active users assigned.`)
      }

      // Delete role permissions first
      await client.query('DELETE FROM role_menu_permissions WHERE role_id = $1', [id])

      // Delete role
      await client.query('DELETE FROM roles WHERE id = $1', [id])

      // Log activity
      await client.query(
        `INSERT INTO activities (user_id, user_name, action_type, entity_type, entity_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [
          user.id,
          user.name,
          'DELETE',
          'role',
          id,
          `Deleted role: ${role.title}`
        ]
      )

      console.log(`✅ Deleted role: ${role.title}`)
      return { success: true, data: role }
    })

  } catch (error: any) {
    console.error('❌ Error deleting role:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete role'
    }
  } finally {
    // Broadcast activity
    broadcastActivity({
      id: Date.now(),
      title: 'Role Deleted',
      description: `Role was removed from the system`,
      timestamp: 'Just now',
      type: 'role',
      user: {
        name: user.name,
        initials: user.name.split(' ').map((n: string) => n[0]).join('')
      }
    })

    revalidatePath('/admin/roles')
    revalidatePath('/dashboard')
  }
})

// 📊 Get role statistics
export const getRoleStats = createProtectedAction(async () => {
  console.log('📊 Fetching role statistics...')
  
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_roles,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_roles,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_roles,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as created_today,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as created_this_week,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as created_this_month
      FROM roles
    `)

    console.log('✅ Retrieved role statistics')
    return {
      success: true,
      data: result.rows[0]
    }

  } catch (error) {
    console.error('❌ Error fetching role stats:', error)
    return {
      success: false,
      error: 'Failed to fetch role statistics'
    }
  }
}) 