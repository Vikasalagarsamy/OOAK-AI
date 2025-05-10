import { createClient } from "@/lib/supabase-browser"

// Cache for permission checks to reduce database queries
const permissionCache: Record<string, { result: boolean; timestamp: number }> = {}
const CACHE_TTL = 60000 // 1 minute cache TTL

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

    // If not in cache or expired, check from database
    const supabase = createClient()

    // First get the user's role
    const { data: userData, error: userError } = await supabase
      .from("user_accounts")
      .select("role_id, roles:role_id(title)")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user role:", userError)
      return false
    }

    // Administrator role has all permissions
    if (userData.roles?.title === "Administrator") {
      // Cache the result
      permissionCache[cacheKey] = { result: true, timestamp: now }
      return true
    }

    // For other roles, check specific menu permissions
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id")
      .ilike("path", `${path}%`)
      .limit(1)

    if (menuError || !menuItems || menuItems.length === 0) {
      console.error("Error or no menu item found for path:", path)
      return false
    }

    const menuItemId = menuItems[0].id

    // Check permissions for this menu item
    const { data: permissions, error: permError } = await supabase
      .from("role_menu_permissions")
      .select("can_view, can_add, can_edit, can_delete")
      .eq("role_id", userData.role_id)
      .eq("menu_item_id", menuItemId)
      .single()

    if (permError || !permissions) {
      console.error("Error or no permissions found:", permError)
      return false
    }

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
    // Clear only for specific user
    Object.keys(permissionCache).forEach((key) => {
      if (key.startsWith(`${userId}:`)) {
        delete permissionCache[key]
      }
    })
  } else {
    // Clear entire cache
    Object.keys(permissionCache).forEach((key) => {
      delete permissionCache[key]
    })
  }
}

export async function checkPermissions(userId: string, permissionsToCheck: { path: string; action?: string }[]) {
  const results = {}
  await Promise.all(
    permissionsToCheck.map(async (perm) => {
      const hasAccess = await hasPermission(userId, perm.path, perm.action || "view")
      results[perm.path] = hasAccess
    }),
  )
  return results
}
