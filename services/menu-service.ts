import { createClient } from "@/lib/supabase"
import type { MenuItem, MenuItemWithPermission } from "@/types/menu"
import { getCurrentUser } from "@/actions/auth-actions"

// Function to get all menu items
export async function getAllMenuItems(): Promise<MenuItem[]> {
  console.log("getAllMenuItems: Fetching all menu items")
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("menu_items").select("*").order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching menu items:", error)
      return []
    }

    console.log(`getAllMenuItems: Found ${data?.length || 0} menu items`)

    return (data || []).map((item) => ({
      id: item.id,
      parentId: item.parent_id,
      name: item.name,
      description: item.description,
      icon: item.icon,
      path: item.path,
      sortOrder: item.sort_order,
      isVisible: item.is_visible,
    }))
  } catch (error) {
    console.error("Unexpected error in getAllMenuItems:", error)
    return []
  }
}

// Function to get menu items with permissions for the current user
export async function getMenuForCurrentUser(): Promise<MenuItemWithPermission[]> {
  try {
    console.log("getMenuForCurrentUser: Starting to fetch menu for current user")

    const user = await getCurrentUser()

    if (!user) {
      console.log("getMenuForCurrentUser: No user found, returning empty menu")
      return []
    }

    console.log("getMenuForCurrentUser: User info:", {
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      roleName: user.roleName,
      isAdmin: user.isAdmin,
    })

    // Use our new database function to get menu permissions for the user
    const supabase = createClient()
    const { data, error } = await supabase.rpc("get_user_menu_permissions", {
      p_user_id: user.id,
    })

    if (error) {
      console.error("Error fetching menu permissions:", error)
      return []
    }

    console.log(`getMenuForCurrentUser: Retrieved ${data?.length || 0} menu items with permissions`)

    // Convert the data to our expected format
    const menuWithPermissions = (data || []).map((item) => ({
      id: item.menu_item_id,
      parentId: item.parent_id,
      name: item.menu_name,
      path: item.menu_path,
      icon: item.icon,
      isVisible: item.is_visible,
      sortOrder: 0, // We'll sort them later
      permissions: {
        canView: item.can_view,
        canAdd: item.can_add,
        canEdit: item.can_edit,
        canDelete: item.can_delete,
      },
      children: [],
    }))

    // Build menu tree
    const menuTree = buildMenuTree(menuWithPermissions)
    console.log(`getMenuForCurrentUser: Final menu tree has ${menuTree.length} top-level items`)

    return menuTree
  } catch (error) {
    console.error("Error getting menu for current user:", error)
    throw error // Re-throw to allow API route to handle it
  }
}

// Helper function to build a nested menu tree
function buildMenuTree(items: MenuItemWithPermission[], parentId: number | null = null): MenuItemWithPermission[] {
  try {
    // First, get all items that match the current parentId
    const currentLevelItems = items.filter((item) => item.parentId === parentId)

    // For each item at this level, recursively build its children
    return currentLevelItems
      .map((item) => {
        // Get all children for this item
        const children = buildMenuTree(items, item.id)

        // If this is a parent item with no visible children, we need to check if it should be shown
        if (children.length === 0 && item.parentId !== null) {
          // Keep the item as is
          return { ...item, children }
        }

        // Otherwise, include the item with its children
        return { ...item, children }
      })
      .filter((item) => {
        // Filter out parent items with no children and no direct path
        // This prevents empty categories from showing in the menu
        if (item.children.length === 0 && !item.path) {
          return false
        }
        return true
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (error) {
    console.error("Error in buildMenuTree:", error)
    return []
  }
}

// Function to get a flat list of all accessible paths for the current user
export async function getAccessiblePaths(): Promise<string[]> {
  try {
    const menu = await getMenuForCurrentUser()
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
    console.error("Error in getAccessiblePaths:", error)
    return []
  }
}
