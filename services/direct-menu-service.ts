import { createClient } from "@/lib/supabase"
import type { MenuItemWithPermission } from "@/types/menu"

export async function getCompleteMenuForUser(userId: number): Promise<MenuItemWithPermission[]> {
  try {
    const supabase = createClient()

    // Get user role
    const { data: user, error: userError } = await supabase
      .from("user_accounts")
      .select("role_id")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error fetching user role:", userError)
      throw userError
    }

    // Get ALL menu items with permissions
    const { data, error } = await supabase
      .from("menu_items")
      .select(`
        id,
        parent_id,
        name,
        path,
        icon,
        sort_order,
        is_visible,
        role_menu_permissions!inner(
          can_view,
          can_add,
          can_edit,
          can_delete
        )
      `)
      .eq("role_menu_permissions.role_id", user.role_id)
      .eq("is_visible", true)
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("sort_order")

    if (error) {
      console.error("Error fetching menu items:", error)
      throw error
    }

    // Transform the data to match the MenuItemWithPermission type
    const menuItems = data.map((item) => ({
      id: item.id,
      parentId: item.parent_id,
      name: item.name,
      path: item.path,
      icon: item.icon,
      sortOrder: item.sort_order,
      isVisible: item.is_visible,
      canView: item.role_menu_permissions[0]?.can_view || false,
      canAdd: item.role_menu_permissions[0]?.can_add || false,
      canEdit: item.role_menu_permissions[0]?.can_edit || false,
      canDelete: item.role_menu_permissions[0]?.can_delete || false,
    }))

    console.log(`Retrieved ${menuItems.length} menu items for user ${userId}`)
    return menuItems
  } catch (error) {
    console.error("Error in getCompleteMenuForUser:", error)
    throw error
  }
}
