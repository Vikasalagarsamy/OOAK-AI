"use server"

import { query, transaction } from "@/lib/postgresql-client"
import type { Role, Permission, RolePermission } from "@/types/permissions"

/**
 * Service for managing roles and permissions
 */
export async function getRoles(): Promise<Role[]> {
  try {
    const result = await query(`
      SELECT id, name, description, status, created_at, updated_at
      FROM audit_security.roles
      ORDER BY name
    `)

    return result.rows
  } catch (error) {
    console.error("Unexpected error in getRoles:", error)
    return []
  }
}

export async function getPermissions(): Promise<Permission[]> {
  try {
    const result = await query(`
      SELECT id, name, description, resource, action, status, created_at, updated_at
      FROM audit_security.permissions
      ORDER BY resource, action
    `)

    return result.rows
  } catch (error) {
    console.error("Unexpected error in getPermissions:", error)
    return []
  }
}

export async function getRolePermissions(roleId: number) {
  try {
    console.log('🔐 Fetching role permissions via PostgreSQL:', roleId)

    const result = await query(`
      SELECT 
        p.*,
        COALESCE(rp.granted, false) as granted
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = $1
      ORDER BY p.resource, p.action
    `, [roleId])

    console.log('✅ Role permissions fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows
    }
  } catch (error) {
    console.error("Error fetching role permissions (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

export async function checkUserPermission(userId: number, resource: string, action: string) {
  try {
    console.log('🔐 Checking user permission via PostgreSQL:', { userId, resource, action })

    const result = await query(`
      SELECT 
        COUNT(*) as count
      FROM employees e
      JOIN roles r ON e.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE e.id = $1 
        AND p.resource = $2 
        AND p.action = $3 
        AND rp.granted = true
        AND e.status = 'active'
    `, [userId, resource, action])

    const hasPermission = parseInt(result.rows[0].count) > 0

    console.log('✅ User permission checked successfully via PostgreSQL:', hasPermission)
    
    return {
      success: true,
      hasPermission
    }
  } catch (error) {
    console.error("Error checking user permission (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hasPermission: false
    }
  }
}

export async function getAllPermissions() {
  try {
    console.log('🔐 Fetching all permissions via PostgreSQL...')

    const result = await query(`
      SELECT *
      FROM permissions
      ORDER BY resource, action
    `)

    console.log('✅ All permissions fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows
    }
  } catch (error) {
    console.error("Error fetching all permissions (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

export async function updateRolePermission(roleId: number, permissionId: number, granted: boolean) {
  try {
    console.log('🔐 Updating role permission via PostgreSQL:', { roleId, permissionId, granted })

    // Use upsert (INSERT ... ON CONFLICT)
    const result = await query(`
      INSERT INTO role_permissions (role_id, permission_id, granted, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (role_id, permission_id) 
      DO UPDATE SET 
        granted = EXCLUDED.granted,
        updated_at = NOW()
      RETURNING *
    `, [roleId, permissionId, granted])

    console.log('✅ Role permission updated successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error updating role permission (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function createPermission(permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('🔐 Creating permission via PostgreSQL:', permission.name)

    const result = await query(`
      INSERT INTO permissions (name, description, resource, action, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [
      permission.name,
      permission.description || null,
      permission.resource,
      permission.action
    ])

    console.log('✅ Permission created successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows[0]
    }
  } catch (error) {
    console.error("Error creating permission (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getUserMenuPermissions(userId: number) {
  try {
    console.log('🔐 Fetching user menu permissions via PostgreSQL:', userId)

    const result = await query(`
      SELECT DISTINCT
        mi.id as menu_item_id,
        mi.title,
        mi.url,
        mi.icon,
        mi.parent_id,
        mi.sort_order
      FROM employees e
      JOIN roles r ON e.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      JOIN menu_items mi ON p.resource = 'menu' AND p.action = mi.url
      WHERE e.id = $1 
        AND rp.granted = true
        AND e.status = 'active'
        AND mi.is_active = true
      ORDER BY mi.sort_order
    `, [userId])

    console.log('✅ User menu permissions fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows
    }
  } catch (error) {
    console.error("Error fetching user menu permissions (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

export async function bulkUpdateRolePermissions(roleId: number, permissions: { permission_id: number, granted: boolean }[]) {
  try {
    console.log('🔐 Bulk updating role permissions via PostgreSQL:', { roleId, count: permissions.length })

    await transaction(async (client) => {
      // Delete existing permissions for this role
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId])

      // Insert new permissions
      if (permissions.length > 0) {
        const values = permissions.map((perm, index) => {
          const baseIndex = index * 3
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`
        }).join(', ')

        const params = permissions.flatMap(perm => [roleId, perm.permission_id, perm.granted])

        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id, granted, created_at, updated_at)
          VALUES ${values}
        `, params)
      }
    })

    console.log('✅ Role permissions bulk updated successfully via PostgreSQL')
    
    return {
      success: true,
      updated_count: permissions.length
    }
  } catch (error) {
    console.error("Error bulk updating role permissions (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      updated_count: 0
    }
  }
}

export async function getPermissionsByResource(resource: string) {
  try {
    console.log('🔐 Fetching permissions by resource via PostgreSQL:', resource)

    const result = await query(`
      SELECT *
      FROM permissions
      WHERE resource = $1
      ORDER BY action
    `, [resource])

    console.log('✅ Permissions by resource fetched successfully via PostgreSQL')
    
    return {
      success: true,
      data: result.rows
    }
  } catch (error) {
    console.error("Error fetching permissions by resource (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }
  }
}

export async function deletePermission(permissionId: number) {
  try {
    console.log('🔐 Deleting permission via PostgreSQL:', permissionId)

    await transaction(async (client) => {
      // Delete role permissions first
      await client.query('DELETE FROM role_permissions WHERE permission_id = $1', [permissionId])
      
      // Delete the permission
      const result = await client.query('DELETE FROM permissions WHERE id = $1 RETURNING id', [permissionId])
      
      if (result.rows.length === 0) {
        throw new Error("Permission not found")
      }
    })

    console.log('✅ Permission deleted successfully via PostgreSQL')
    
    return {
      success: true,
      data: { id: permissionId }
    }
  } catch (error) {
    console.error("Error deleting permission (PostgreSQL):", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getAuditTrail(entityType: string, entityId: string, limit = 10): Promise<any[]> {
  try {
    const result = await query(`
      SELECT *
      FROM audit_security.audit_trail
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `, [entityType, entityId, limit])

    return result.rows
  } catch (error) {
    console.error("Unexpected error in getAuditTrail:", error)
    return []
  }
}
