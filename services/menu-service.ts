import { createClient } from "@/lib/supabase"
import type { MenuItem, MenuPermission, MenuItemWithPermission } from "@/types/menu"
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

// Function to get menu permissions for a specific role
export async function getMenuPermissionsByRoleId(roleId: number): Promise<MenuPermission[]> {
  console.log(`getMenuPermissionsByRoleId: Fetching permissions for role ID ${roleId}`)
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("role_menu_permissions").select("*").eq("role_id", roleId)

    if (error) {
      console.error("Error fetching menu permissions:", error)
      return []
    }

    console.log(`getMenuPermissionsByRoleId: Found ${data?.length || 0} permissions for role ID ${roleId}`)

    return (data || []).map((permission) => ({
      menuItemId: permission.menu_item_id,
      canView: permission.can_view,
      canAdd: permission.can_add,
      canEdit: permission.can_edit,
      canDelete: permission.can_delete,
    }))
  } catch (error) {
    console.error(`Unexpected error in getMenuPermissionsByRoleId for roleId ${roleId}:`, error)
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

    // Get all menu items and permissions
    const allMenuItems = await getAllMenuItems()

    if (allMenuItems.length === 0) {
      console.warn("getMenuForCurrentUser: No menu items found in the database")
      return []
    }

    const roleId = user.roleId || 1 // Default to role ID 1 if not set
    const permissions = await getMenuPermissionsByRoleId(roleId)

    console.log(`getMenuForCurrentUser: Retrieved ${permissions.length} permissions for role ID ${roleId}`)

    // Map permissions to menu items
    const menuWithPermissions = allMenuItems.map((menuItem) => {
      // If user is admin (role ID 1), grant all permissions automatically
      if (user.isAdmin || roleId === 1) {
        return {
          ...menuItem,
          permissions: {
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
          },
        }
      }

      // Otherwise, check permissions from the database
      const permission = permissions.find((p) => p.menuItemId === menuItem.id) || {
        menuItemId: menuItem.id,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      }

      return {
        ...menuItem,
        permissions: {
          canView: permission.canView,
          canAdd: permission.canAdd,
          canEdit: permission.canEdit,
          canDelete: permission.canDelete,
        },
      }
    })

    // Only include visible items and those the user can view
    const filteredMenuItems = menuWithPermissions.filter(
      (item) => item.isVisible && (user.isAdmin || roleId === 1 || item.permissions.canView),
    )

    console.log(`getMenuForCurrentUser: Filtered to ${filteredMenuItems.length} visible menu items`)

    // Build menu tree
    const menuTree = buildMenuTree(filteredMenuItems)
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
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: buildMenuTree(items, item.id),
      }))
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
