import { createClient } from "@/lib/supabase"
import type { MenuItem, MenuPermission, MenuItemWithPermission } from "@/types/menu"
import { getCurrentUser } from "@/actions/auth-actions"

// Function to get all menu items
export async function getAllMenuItems(): Promise<MenuItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("menu_items").select("*").order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching menu items:", error)
    return []
  }

  return data.map((item) => ({
    id: item.id,
    parentId: item.parent_id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    path: item.path,
    sortOrder: item.sort_order,
    isVisible: item.is_visible,
  }))
}

// Function to get menu permissions for a specific role
export async function getMenuPermissionsByRoleId(roleId: number): Promise<MenuPermission[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("role_menu_permissions").select("*").eq("role_id", roleId)

  if (error) {
    console.error("Error fetching menu permissions:", error)
    return []
  }

  return data.map((permission) => ({
    menuItemId: permission.menu_item_id,
    canView: permission.can_view,
    canAdd: permission.can_add,
    canEdit: permission.can_edit,
    canDelete: permission.can_delete,
  }))
}

// Function to get menu items with permissions for the current user
export async function getMenuForCurrentUser(): Promise<MenuItemWithPermission[]> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return []
    }

    // Get all menu items and permissions
    const allMenuItems = await getAllMenuItems()
    const roleId = user.roleId
    const permissions = await getMenuPermissionsByRoleId(roleId)

    // Map permissions to menu items
    const menuWithPermissions = allMenuItems.map((menuItem) => {
      // If user is admin, grant all permissions automatically
      if (user.isAdmin) {
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
      (item) => item.isVisible && (user.isAdmin || item.permissions.canView),
    )

    // Build menu tree
    return buildMenuTree(filteredMenuItems)
  } catch (error) {
    console.error("Error getting menu for current user:", error)
    return []
  }
}

// Helper function to build a nested menu tree
function buildMenuTree(items: MenuItemWithPermission[], parentId: number | null = null): MenuItemWithPermission[] {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildMenuTree(items, item.id),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

// Function to get a flat list of all accessible paths for the current user
export async function getAccessiblePaths(): Promise<string[]> {
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
}
