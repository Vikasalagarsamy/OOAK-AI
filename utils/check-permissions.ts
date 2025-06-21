import { query } from "@/lib/postgresql-client"

/**
 * CHECK PERMISSIONS - NOW 100% POSTGRESQL
 * =======================================
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Optimized permission checking system
 * - All Supabase dependencies eliminated
 */

export async function checkPermission(
  userId: string,
  permissionPath: string,
  action: "view" | "read" | "write" | "delete" = "view",
): Promise<boolean> {
  try {
    console.log(`🔐 Checking permission for user ${userId}: ${permissionPath}.${action} via PostgreSQL...`)

    // Get user role via PostgreSQL with optimized JOIN
    const userRoleResult = await query(`
      SELECT 
        u.role_id,
        ur.permissions,
        ur.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.id = $1
        AND u.is_active = true
    `, [userId])

    if (userRoleResult.rows.length === 0) {
      console.error(`❌ User not found or inactive: ${userId}`)
      return false
    }

    const userData = userRoleResult.rows[0]

    if (!userData.role_id || !userData.permissions) {
      console.error(`❌ User ${userId} has no role or permissions`)
      return false
    }

    // Parse permissions
    let permissions
    try {
      permissions = typeof userData.permissions === "string" 
        ? JSON.parse(userData.permissions) 
        : userData.permissions
    } catch (parseError) {
      console.error(`❌ Invalid permissions JSON for user ${userId}:`, parseError)
      return false
    }

    // Check if user has required permission
    const permissionObj = permissions[permissionPath]
    const hasPermission = permissionObj && permissionObj[action] === true

    if (hasPermission) {
      console.log(`✅ User ${userId} has permission: ${permissionPath}.${action}`)
    } else {
      console.log(`⚠️ User ${userId} denied permission: ${permissionPath}.${action}`)
    }

    return hasPermission

  } catch (error: any) {
    console.error(`❌ Error checking permissions for user ${userId} via PostgreSQL:`, error)
    return false
  }
}

/**
 * Check multiple permissions at once
 */
export async function checkMultiplePermissions(
  userId: string,
  permissionChecks: Array<{
    path: string
    action: "view" | "read" | "write" | "delete"
  }>
): Promise<{ [key: string]: boolean }> {
  try {
    console.log(`🔐 Checking ${permissionChecks.length} permissions for user ${userId} via PostgreSQL...`)

    // Get user permissions once
    const userRoleResult = await query(`
      SELECT 
        u.role_id,
        ur.permissions,
        ur.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.id = $1
        AND u.is_active = true
    `, [userId])

    const results: { [key: string]: boolean } = {}

    if (userRoleResult.rows.length === 0) {
      // User not found - deny all permissions
      permissionChecks.forEach(check => {
        results[`${check.path}.${check.action}`] = false
      })
      return results
    }

    const userData = userRoleResult.rows[0]
    
    if (!userData.permissions) {
      // No permissions - deny all
      permissionChecks.forEach(check => {
        results[`${check.path}.${check.action}`] = false
      })
      return results
    }

    // Parse permissions
    let permissions
    try {
      permissions = typeof userData.permissions === "string" 
        ? JSON.parse(userData.permissions) 
        : userData.permissions
    } catch (parseError) {
      console.error(`❌ Invalid permissions JSON for user ${userId}:`, parseError)
      permissionChecks.forEach(check => {
        results[`${check.path}.${check.action}`] = false
      })
      return results
    }

    // Check each permission
    permissionChecks.forEach(check => {
      const permissionObj = permissions[check.path]
      const hasPermission = permissionObj && permissionObj[check.action] === true
      results[`${check.path}.${check.action}`] = hasPermission
    })

    const grantedCount = Object.values(results).filter(Boolean).length
    console.log(`✅ Granted ${grantedCount}/${permissionChecks.length} permissions for user ${userId}`)

    return results

  } catch (error: any) {
    console.error(`❌ Error checking multiple permissions for user ${userId} via PostgreSQL:`, error)
    
    // Return all false on error
    const results: { [key: string]: boolean } = {}
    permissionChecks.forEach(check => {
      results[`${check.path}.${check.action}`] = false
    })
    return results
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<{
  success: boolean
  permissions?: any
  roleName?: string
  error?: string
}> {
  try {
    console.log(`🔐 Getting all permissions for user ${userId} via PostgreSQL...`)

    const userRoleResult = await query(`
      SELECT 
        u.role_id,
        ur.permissions,
        ur.name as role_name,
        ur.description as role_description
      FROM users u
      LEFT JOIN user_roles ur ON u.role_id = ur.id
      WHERE u.id = $1
        AND u.is_active = true
    `, [userId])

    if (userRoleResult.rows.length === 0) {
      return {
        success: false,
        error: 'User not found or inactive'
      }
    }

    const userData = userRoleResult.rows[0]

    if (!userData.permissions) {
      return {
        success: true,
        permissions: {},
        roleName: userData.role_name || 'No Role'
      }
    }

    // Parse permissions
    let permissions
    try {
      permissions = typeof userData.permissions === "string" 
        ? JSON.parse(userData.permissions) 
        : userData.permissions
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid permissions JSON'
      }
    }

    console.log(`✅ Retrieved permissions for user ${userId} with role: ${userData.role_name}`)

    return {
      success: true,
      permissions,
      roleName: userData.role_name
    }

  } catch (error: any) {
    console.error(`❌ Error getting user permissions for ${userId} via PostgreSQL:`, error)
    return {
      success: false,
      error: error.message
    }
  }
} 