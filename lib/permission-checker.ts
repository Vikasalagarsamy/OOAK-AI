// Permission checker that integrates with the role manager system
import { query, transaction } from "@/lib/postgresql-client"
import { getCurrentUser } from "@/actions/auth-actions"
import { ENTERPRISE_MENU_CONFIG, type MenuItemConfig } from "@/lib/menu-system"

// Legacy type alias for backwards compatibility
export type PermissionMenuItem = MenuItemConfig

interface UserPermissions {
  [menuId: string]: {
    view: boolean
    edit: boolean
    delete: boolean
  }
}

// Cache for performance
let permissionsCache: UserPermissions | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Get current user's permissions from the role manager system
export async function getUserPermissions(): Promise<UserPermissions> {
  // Check cache first
  if (permissionsCache && Date.now() < cacheExpiry) {
    return permissionsCache
  }

  try {
    const user = await getCurrentUser()
    if (!user || !user.roleId) {
      console.log("No user or role found")
      return {}
    }

    console.log("Getting permissions for user:", user.username, "role:", user.roleId)

    // Get role permissions from the roles table (your role manager data)
    const roleResult = await query(
      "SELECT permissions FROM roles WHERE id = $1",
      [user.roleId]
    )

    if (!roleResult.rows || roleResult.rows.length === 0) {
      console.error("Error fetching role permissions: Role not found")
      return {}
    }

    const roleData = roleResult.rows[0]

    if (!roleData?.permissions) {
      console.log("No permissions found for role:", user.roleId)
      return {}
    }

    // Cache the result
    permissionsCache = roleData.permissions as UserPermissions
    cacheExpiry = Date.now() + CACHE_DURATION

    console.log("✅ Loaded permissions for role:", user.roleId, Object.keys(permissionsCache).length, "items")
    return permissionsCache

  } catch (error) {
    console.error("Error getting user permissions:", error)
    return {}
  }
}

// Check if user has permission for a specific menu item
export async function hasMenuPermission(menuId: string, permission: 'view' | 'edit' | 'delete' = 'view'): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    
    // Admins have all permissions
    if (user?.isAdmin) {
      return true
    }

    const permissions = await getUserPermissions()
    const menuPermission = permissions[menuId]
    
    if (!menuPermission) {
      // Check parent permission if this is a child item
      for (const section of ENTERPRISE_MENU_CONFIG) {
        if (section.items?.some((child: MenuItemConfig) => child.id === menuId)) {
          // Check if parent section has permission
          const parentPermission = permissions[section.id]
          return parentPermission?.[permission] || false
        }
      }
      return false
    }

    return menuPermission[permission] || false
  } catch (error) {
    console.error("Error checking menu permission:", error)
    return false
  }
}

// Filter menu items based on user permissions
export async function filterMenuByPermissions(menuItems: MenuItemConfig[]): Promise<MenuItemConfig[]> {
  try {
    const permissions = await getUserPermissions()
    const user = await getCurrentUser()
    
    // Admins see everything
    if (user?.isAdmin) {
      return menuItems
    }

    const filteredItems: MenuItemConfig[] = []

    for (const item of menuItems) {
      const itemPermission = permissions[item.id]
      
      // Check if user has view permission for this item
      if (itemPermission?.view) {
        const filteredItem: MenuItemConfig = { ...item }

        // Filter children if they exist
        if (item.children) {
          const filteredChildren = []
          for (const child of item.children) {
            const childPermission = permissions[child.id]
            if (childPermission?.view) {
              filteredChildren.push(child)
            }
          }
          
          // Only include the section if it has visible children or is directly accessible
          if (filteredChildren.length > 0 || item.path) {
            const itemWithChildren = { ...filteredItem, children: filteredChildren }
            filteredItems.push(itemWithChildren)
          }
        } else {
          // No children, include if user has permission
          filteredItems.push(filteredItem)
        }
      }
    }

    return filteredItems
  } catch (error) {
    console.error("Error filtering menu by permissions:", error)
    return menuItems // Return all items on error to avoid breaking the UI
  }
}

// Clear permissions cache (call this when user role changes)
export function clearPermissionsCache() {
  permissionsCache = null
  cacheExpiry = 0
} 