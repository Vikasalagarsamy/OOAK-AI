import { createClient } from "@/lib/supabase"
import type { MenuItem, MenuItemWithPermission } from "@/types/menu"
import { getCurrentUser } from "@/actions/auth-actions"

/**
 * Unified Menu Service
 *
 * This service provides a single source of truth for menu items across the application.
 * It ensures that the same menu structure is used in both the main navigation and
 * the role permissions management section.
 */

// Get all menu items from the database
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

// Get menu items with permissions for the current user
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

    // Use our database function to get menu permissions for the user
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
      sortOrder: item.sort_order || 0,
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
    throw error
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

// Function to get a flat list of all menu items (for admin purposes)
export async function getAllMenuItemsFlat(): Promise<MenuItem[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("menu_items")
      .select("id, parent_id, name, path, icon, is_visible, sort_order, description")
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching all menu items:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      parentId: item.parent_id,
      name: item.name,
      path: item.path,
      icon: item.icon,
      isVisible: item.is_visible,
      sortOrder: item.sort_order,
      description: item.description,
    }))
  } catch (error) {
    console.error("Error in getAllMenuItemsFlat:", error)
    return []
  }
}

// Function to get menu items for a specific role
export async function getMenuItemsForRole(roleId: number): Promise<{
  menuItems: MenuItem[]
  permissions: Record<
    number,
    {
      canView: boolean
      canAdd: boolean
      canEdit: boolean
      canDelete: boolean
    }
  >
}> {
  try {
    const supabase = createClient()

    // Get all menu items
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, parent_id, name, path, icon, is_visible, sort_order")
      .order("sort_order", { ascending: true })

    if (menuError) {
      console.error("Error fetching menu items for role:", menuError)
      return { menuItems: [], permissions: {} }
    }

    // Get permissions for the role
    const { data: permissionsData, error: permError } = await supabase
      .from("role_menu_permissions")
      .select("menu_item_id, can_view, can_add, can_edit, can_delete")
      .eq("role_id", roleId)

    if (permError) {
      console.error("Error fetching permissions for role:", permError)
      return {
        menuItems: menuItems.map((item) => ({
          id: item.id,
          parentId: item.parent_id,
          name: item.name,
          path: item.path,
          icon: item.icon,
          isVisible: item.is_visible,
          sortOrder: item.sort_order,
        })),
        permissions: {},
      }
    }

    // Convert permissions to a map for easier lookup
    const permissions: Record<
      number,
      {
        canView: boolean
        canAdd: boolean
        canEdit: boolean
        canDelete: boolean
      }
    > = {}

    permissionsData.forEach((perm) => {
      permissions[perm.menu_item_id] = {
        canView: perm.can_view,
        canAdd: perm.can_add,
        canEdit: perm.can_edit,
        canDelete: perm.can_delete,
      }
    })

    return {
      menuItems: menuItems.map((item) => ({
        id: item.id,
        parentId: item.parent_id,
        name: item.name,
        path: item.path,
        icon: item.icon,
        isVisible: item.is_visible,
        sortOrder: item.sort_order,
      })),
      permissions,
    }
  } catch (error) {
    console.error("Error in getMenuItemsForRole:", error)
    return { menuItems: [], permissions: {} }
  }
}

// Function to synchronize menu items
export async function synchronizeMenuItems(): Promise<boolean> {
  try {
    // This function ensures that all menu items in the menu_structure.ts file
    // are present in the database, and that their hierarchy is correct.
    // It's used to keep the database in sync with the code.

    // Implementation would depend on your specific requirements
    // For now, we'll just return true
    return true
  } catch (error) {
    console.error("Error synchronizing menu items:", error)
    return false
  }
}

// Add this new function to detect menu changes
export async function detectMenuChanges(): Promise<{
  added: MenuItem[]
  removed: MenuItem[]
  modified: MenuItem[]
}> {
  try {
    const supabase = createClient()

    // Get current menu items from the database
    const { data: currentItems, error: currentError } = await supabase
      .from("menu_items")
      .select("id, parent_id, name, path, icon, is_visible, sort_order, last_updated")
      .order("id")

    if (currentError) {
      console.error("Error fetching current menu items:", currentError)
      return { added: [], removed: [], modified: [] }
    }

    // Get the last known state of menu items (from a tracking table)
    const { data: previousItems, error: previousError } = await supabase
      .from("menu_items_tracking")
      .select("menu_item_id, last_known_state")
      .order("menu_item_id")

    if (previousError) {
      // If the tracking table doesn't exist yet, we'll create it later
      console.log("Menu tracking table may not exist yet:", previousError)
      return { added: [], removed: [], modified: [] }
    }

    // Convert previous items to a map for easier comparison
    const previousMap = new Map()
    ;(previousItems || []).forEach((item) => {
      try {
        previousMap.set(item.menu_item_id, JSON.parse(item.last_known_state))
      } catch (e) {
        console.error(`Error parsing previous state for menu item ${item.menu_item_id}:`, e)
      }
    })

    // Find added, removed, and modified items
    const added: MenuItem[] = []
    const modified: MenuItem[] = []

    currentItems.forEach((item) => {
      const menuItem = {
        id: item.id,
        parentId: item.parent_id,
        name: item.name,
        path: item.path,
        icon: item.icon,
        isVisible: item.is_visible,
        sortOrder: item.sort_order,
      }

      if (!previousMap.has(item.id)) {
        added.push(menuItem)
      } else {
        // Check if the item has been modified
        const previous = previousMap.get(item.id)
        if (
          previous.name !== item.name ||
          previous.path !== item.path ||
          previous.parentId !== item.parent_id ||
          previous.icon !== item.icon ||
          previous.isVisible !== item.is_visible ||
          previous.sortOrder !== item.sort_order
        ) {
          modified.push(menuItem)
        }
      }

      // Remove from map to track what's left (removed items)
      previousMap.delete(item.id)
    })

    // Any items left in the map have been removed
    const removed: MenuItem[] = []
    previousMap.forEach((value, key) => {
      removed.push({
        id: key,
        ...value,
      })
    })

    return { added, removed, modified }
  } catch (error) {
    console.error("Error detecting menu changes:", error)
    return { added: [], removed: [], modified: [] }
  }
}

// Add this function to update the tracking table
export async function updateMenuTracking(): Promise<boolean> {
  try {
    const supabase = createClient()

    // Get current menu items
    const { data: currentItems, error: currentError } = await supabase
      .from("menu_items")
      .select("id, parent_id, name, path, icon, is_visible, sort_order")
      .order("id")

    if (currentError) {
      console.error("Error fetching current menu items for tracking:", currentError)
      return false
    }

    // Check if tracking table exists
    const { data: tableExists, error: tableError } = await supabase.rpc("check_if_table_exists", {
      table_name: "menu_items_tracking",
    })

    if (tableError || !tableExists) {
      // Create tracking table if it doesn't exist
      const { error: createError } = await supabase.rpc("execute_sql", {
        sql_statement: `
            CREATE TABLE IF NOT EXISTS menu_items_tracking (
              id SERIAL PRIMARY KEY,
              menu_item_id INTEGER NOT NULL UNIQUE,
              last_known_state JSONB NOT NULL,
              last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
          `,
      })

      if (createError) {
        console.error("Error creating menu tracking table:", createError)
        return false
      }
    }

    // Clear existing tracking data
    const { error: clearError } = await supabase.from("menu_items_tracking").delete().neq("id", 0) // This will delete all rows

    if (clearError) {
      console.error("Error clearing menu tracking data:", clearError)
      return false
    }

    // Insert current items into tracking table
    const trackingData = currentItems.map((item) => ({
      menu_item_id: item.id,
      last_known_state: JSON.stringify({
        parentId: item.parent_id,
        name: item.name,
        path: item.path,
        icon: item.icon,
        isVisible: item.is_visible,
        sortOrder: item.sort_order,
      }),
    }))

    const { error: insertError } = await supabase.from("menu_items_tracking").insert(trackingData)

    if (insertError) {
      console.error("Error updating menu tracking data:", insertError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateMenuTracking:", error)
    return false
  }
}
