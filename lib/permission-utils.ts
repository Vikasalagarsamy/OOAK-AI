import { query, transaction } from "@/lib/postgresql-client"

// Cache for permission checks to reduce database queries
const permissionCache: Record<string, { result: boolean; timestamp: number }> = {}
const userRoleCache: Record<string, { isAdmin: boolean; roleId: number; timestamp: number }> = {}
const CACHE_TTL = 60000 // 1 minute cache TTL
const USER_CACHE_TTL = 300000 // 5 minutes for user role cache

// Get user role with caching
async function getUserRole(userId: string): Promise<{ isAdmin: boolean; roleId: number | null }> {
  const cacheKey = userId
  const now = Date.now()
  
  // Check cache first
  const cachedRole = userRoleCache[cacheKey]
  if (cachedRole && now - cachedRole.timestamp < USER_CACHE_TTL) {
    return { isAdmin: cachedRole.isAdmin, roleId: cachedRole.roleId }
  }

  try {
    // First get the user's role
    const userResult = await query(
      `SELECT ua.role_id, r.title 
       FROM user_accounts ua 
       LEFT JOIN roles r ON ua.role_id = r.id 
       WHERE ua.id = $1`,
      [userId]
    )

    if (!userResult.rows || userResult.rows.length === 0) {
      console.error("Error fetching user role: User not found")
      return { isAdmin: false, roleId: null }
    }

    const userData = userResult.rows[0]
    const isAdmin = userData.title === "Administrator"
    const roleId = userData.role_id

    // Cache the role info
    userRoleCache[cacheKey] = { isAdmin, roleId, timestamp: now }
    
    return { isAdmin, roleId }
  } catch (error) {
    console.error("Error fetching user role:", error)
    return { isAdmin: false, roleId: null }
  }
}

// Check if a user has permission to access a specific path
export async function hasPermission(userId: string, path: string, action = "view"): Promise<boolean> {
  try {
    // Generate a cache key
    const cacheKey = `${userId}:${path}:${action}`

    // Check cache first
    const now = Date.now()
    const cachedValue = permissionCache[cacheKey]
    if (cachedValue && now - cachedValue.timestamp < CACHE_TTL) {
      return cachedValue.result
    }

    // Get user role (cached)
    const { isAdmin, roleId } = await getUserRole(userId)

    // Administrator role has all permissions - cache and return immediately
    if (isAdmin) {
      permissionCache[cacheKey] = { result: true, timestamp: now }
      return true
    }

    // For non-admins, check specific menu permissions
    if (!roleId) {
      permissionCache[cacheKey] = { result: false, timestamp: now }
      return false
    }

    // Check menu permissions
    const menuResult = await query(
      "SELECT id FROM menu_items WHERE path ILIKE $1 LIMIT 1",
      [`${path}%`]
    )

    if (!menuResult.rows || menuResult.rows.length === 0) {
      console.error("Error or no menu item found for path:", path)
      permissionCache[cacheKey] = { result: false, timestamp: now }
      return false
    }

    const menuItemId = menuResult.rows[0].id

    // Check permissions for this menu item
    const permissionResult = await query(
      `SELECT can_view, can_add, can_edit, can_delete 
       FROM role_menu_permissions 
       WHERE role_id = $1 AND menu_item_id = $2`,
      [roleId, menuItemId]
    )

    if (!permissionResult.rows || permissionResult.rows.length === 0) {
      console.error("Error or no permissions found")
      permissionCache[cacheKey] = { result: false, timestamp: now }
      return false
    }

    const permissions = permissionResult.rows[0]

    // Check the specific action permission
    let hasAccess = false
    switch (action.toLowerCase()) {
      case "view":
        hasAccess = permissions.can_view
        break
      case "add":
        hasAccess = permissions.can_add
        break
      case "edit":
        hasAccess = permissions.can_edit
        break
      case "delete":
        hasAccess = permissions.can_delete
        break
      default:
        hasAccess = false
    }

    // Cache the result
    permissionCache[cacheKey] = { result: hasAccess, timestamp: now }
    return hasAccess
  } catch (error) {
    console.error("Permission check error:", error)
    return false
  }
}

// Get current user from client-side
export async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/status", {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Clear permission cache for a user
export function clearPermissionCache(userId?: string) {
  if (userId) {
    // Clear permission cache for specific user
    Object.keys(permissionCache).forEach((key) => {
      if (key.startsWith(`${userId}:`)) {
        delete permissionCache[key]
      }
    })
    // Clear role cache for specific user
    delete userRoleCache[userId]
  } else {
    // Clear entire cache
    Object.keys(permissionCache).forEach((key) => {
      delete permissionCache[key]
    })
    Object.keys(userRoleCache).forEach((key) => {
      delete userRoleCache[key]
    })
  }
}

// Enhanced permission checker that can handle multiple permissions efficiently
export async function checkPermissions(userId: string, permissionsToCheck: { path: string; action?: string }[]): Promise<Record<string, boolean>> {
  // Get user role once
  const { isAdmin } = await getUserRole(userId)
  
  // If admin, return all true immediately
  if (isAdmin) {
    const results: Record<string, boolean> = {}
    permissionsToCheck.forEach((perm) => {
      results[perm.path] = true
      // Cache each permission for future use
      const cacheKey = `${userId}:${perm.path}:${perm.action || "view"}`
      permissionCache[cacheKey] = { result: true, timestamp: Date.now() }
    })
    return results
  }

  // For non-admins, check each permission
  const results: Record<string, boolean> = {}
  await Promise.all(
    permissionsToCheck.map(async (perm) => {
      const hasAccess = await hasPermission(userId, perm.path, perm.action || "view")
      results[perm.path] = hasAccess
    }),
  )
  return results
}
