import { createClient } from "@/lib/supabase/server"
import type { MenuItem, MenuItemWithChildren, Role, RolePermission } from "@/types/menu-permissions"

export async function getMenuItems(): Promise<MenuItem[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("menu_items").select("*").order("sort_order")

  if (error) {
    console.error("Error fetching menu items:", error)
    return []
  }

  return data || []
}

export async function getMenuItemsWithChildren(): Promise<MenuItemWithChildren[]> {
  const items = await getMenuItems()

  // Create a map of items by id for quick lookup
  const itemMap = new Map<number, MenuItemWithChildren>()

  // Initialize each item with an empty children array
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] })
  })

  // Build the tree structure
  const rootItems: MenuItemWithChildren[] = []

  items.forEach((item) => {
    const menuItem = itemMap.get(item.id)

    if (menuItem) {
      if (item.parentId === null) {
        rootItems.push(menuItem)
      } else {
        const parent = itemMap.get(item.parentId)
        if (parent) {
          parent.children.push(menuItem)
        }
      }
    }
  })

  return rootItems
}

export async function getRoles(): Promise<Role[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("roles").select("*").order("name")

  if (error) {
    console.error("Error fetching roles:", error)
    return []
  }

  return data || []
}

export async function getMenuPermissions(menuItemId: number): Promise<RolePermission[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from("role_menu_permissions").select("*").eq("menu_item_id", menuItemId)

  if (error) {
    console.error("Error fetching menu permissions:", error)
    return []
  }

  return (
    data.map((item) => ({
      roleId: item.role_id,
      menuItemId: item.menu_item_id,
      canView: item.can_view,
      canAdd: item.can_add,
      canEdit: item.can_edit,
      canDelete: item.can_delete,
    })) || []
  )
}

export async function updateMenuPermission(permission: RolePermission): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from("role_menu_permissions")
    .update({
      can_view: permission.canView,
      can_add: permission.canAdd,
      can_edit: permission.canEdit,
      can_delete: permission.canDelete,
      updated_at: new Date().toISOString(),
    })
    .eq("role_id", permission.roleId)
    .eq("menu_item_id", permission.menuItemId)

  if (error) {
    console.error("Error updating menu permission:", error)
    return false
  }

  return true
}
