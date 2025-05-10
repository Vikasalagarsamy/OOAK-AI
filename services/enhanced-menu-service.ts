import { createClient } from "@/lib/supabase"
import type { MenuItemWithPermission } from "@/types/menu"
import { getCurrentUser } from "@/actions/auth-actions"

// Function to get menu items with permissions using our new database function
export async function getEnhancedMenuForCurrentUser(): Promise<MenuItemWithPermission[]> {
  try {
    console.log("getEnhancedMenuForCurrentUser: Starting to fetch menu for current user")

    const user = await getCurrentUser()

    if (!user) {
      console.log("getEnhancedMenuForCurrentUser: No user found, returning empty menu")
      return []
    }

    console.log("getEnhancedMenuForCurrentUser: User info:", {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      roleName: user.roleName,
      isAdmin: user.isAdmin,
    })

    // Use our new database function to get complete menu hierarchy
    const supabase = createClient()
    const { data, error } = await supabase.rpc("get_complete_menu_hierarchy", {
      p_user_id: user.id,
    })

    if (error) {
      console.error("Error fetching menu hierarchy:", error)
      return []
    }

    console.log(`getEnhancedMenuForCurrentUser: Retrieved ${data?.length || 0} menu items with permissions`)

    // Convert the data to our expected format
    const menuItems = (data || []).map((item) => ({
      id: item.id,
      parentId: item.parent_id,
      name: item.name,
      path: item.path,
      icon: item.icon,
      isVisible: item.is_visible,
      sortOrder: item.sort_order,
      permissions: {
        canView: item.can_view,
        canAdd: item.can_add,
        canEdit: item.can_edit,
        canDelete: item.can_delete,
      },
    }))

    // Build menu tree with improved logic
    const menuTree = buildEnhancedMenuTree(menuItems)
    console.log(`getEnhancedMenuForCurrentUser: Final menu tree has ${menuTree.length} top-level items`)

    return menuTree
  } catch (error) {
    console.error("Error getting enhanced menu for current user:", error)
    throw error
  }
}

// Improved menu tree building function
function buildEnhancedMenuTree(
  items: MenuItemWithPermission[],
  parentId: number | null = null,
): MenuItemWithPermission[] {
  try {
    // First, get all items that match the current parentId
    const currentLevelItems = items.filter((item) => item.parentId === parentId)

    // For each item at this level, recursively build its children
    return currentLevelItems
      .map((item) => {
        // Get all children for this item
        const children = buildEnhancedMenuTree(items, item.id)

        // Always include the item with its children
        return { ...item, children }
      })
      .filter((item) => {
        // Only filter out items that are explicitly marked as not visible
        // This ensures we don't accidentally hide menu items
        return item.isVisible !== false
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (error) {
    console.error("Error in buildEnhancedMenuTree:", error)
    return []
  }
}

// Function to get a flat list of all accessible paths for the current user
export async function getEnhancedAccessiblePaths(): Promise<string[]> {
  try {
    const menu = await getEnhancedMenuForCurrentUser()
    const paths: string[] = []

    function extractPaths(items: MenuItemWithPermission[]) {
      for (const item of items) {
        if (item.path) {
          paths.push(item.path)
        }
        if (item.children && item.children.length > 0) {
          extractPaths(item.children)
        }
      }
    }

    extractPaths(menu)
    return paths
  } catch (error) {
    console.error("Error in getEnhancedAccessiblePaths:", error)
    return []
  }
}
