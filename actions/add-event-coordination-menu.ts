"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addEventCoordinationMenu() {
  try {
    const supabase = createClient()

    // Step 1: Add the main Event Co-ordination menu item
    const { data: mainMenuData, error: mainMenuError } = await supabase
      .from("menu_items")
      .insert({
        name: "Event Co-ordination",
        path: "/events",
        icon: "Calendar",
        parent_id: null,
        sort_order: 100, // A high number to ensure it appears at the end
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (mainMenuError) {
      console.error("Error adding Event Co-ordination main menu:", mainMenuError)
      return { success: false, error: `Error adding Event Co-ordination main menu: ${mainMenuError.message}` }
    }

    // Get the ID of the newly inserted main menu item
    const mainMenuId = mainMenuData?.[0]?.id

    if (!mainMenuId) {
      return { success: false, error: "Failed to get ID of the newly created menu item" }
    }

    // Step 2: Add sub-menu items
    const subMenuItems = [
      {
        name: "Event Dashboard",
        path: "/events/dashboard",
        icon: "LayoutDashboard",
        parent_id: mainMenuId,
        sort_order: 1,
        is_visible: true,
      },
      {
        name: "Event Calendar",
        path: "/events/calendar",
        icon: "CalendarDays",
        parent_id: mainMenuId,
        sort_order: 2,
        is_visible: true,
      },
      {
        name: "Create Event",
        path: "/events/create",
        icon: "PlusCircle",
        parent_id: mainMenuId,
        sort_order: 3,
        is_visible: true,
      },
      {
        name: "Event Types",
        path: "/events/types",
        icon: "Tags",
        parent_id: mainMenuId,
        sort_order: 4,
        is_visible: true,
      },
      {
        name: "Event Reports",
        path: "/events/reports",
        icon: "BarChart",
        parent_id: mainMenuId,
        sort_order: 5,
        is_visible: true,
      },
    ]

    // Add timestamp fields to each sub-menu item
    const subMenuItemsWithTimestamps = subMenuItems.map((item) => ({
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Insert all sub-menu items
    const { error: subMenuError } = await supabase.from("menu_items").insert(subMenuItemsWithTimestamps)

    if (subMenuError) {
      console.error("Error adding Event Co-ordination sub-menu items:", subMenuError)
      return { success: false, error: `Error adding Event Co-ordination sub-menu items: ${subMenuError.message}` }
    }

    // Step 3: Get all menu items related to Event Co-ordination
    const { data: allEventMenuItems, error: menuItemsError } = await supabase
      .from("menu_items")
      .select("id")
      .or(`id.eq.${mainMenuId},parent_id.eq.${mainMenuId}`)

    if (menuItemsError) {
      console.error("Error getting Event Co-ordination menu items:", menuItemsError)
      return { success: false, error: `Error getting Event Co-ordination menu items: ${menuItemsError.message}` }
    }

    // Step 4: Get all roles
    const { data: roles, error: rolesError } = await supabase.from("roles").select("id")

    if (rolesError) {
      console.error("Error getting roles:", rolesError)
      return { success: false, error: `Error getting roles: ${rolesError.message}` }
    }

    // Step 5: Create permissions for all roles and menu items
    const permissions = []

    for (const role of roles) {
      for (const menuItem of allEventMenuItems) {
        permissions.push({
          role_id: role.id,
          menu_item_id: menuItem.id,
          can_view: role.id === 1, // Only admin can view by default
          can_add: role.id === 1, // Only admin can add by default
          can_edit: role.id === 1, // Only admin can edit by default
          can_delete: role.id === 1, // Only admin can delete by default
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    // Insert all permissions
    const { error: permissionsError } = await supabase.from("role_menu_permissions").insert(permissions)

    if (permissionsError) {
      console.error("Error adding permissions for Event Co-ordination menu:", permissionsError)
      return { success: false, error: `Error adding permissions: ${permissionsError.message}` }
    }

    // Revalidate paths to refresh the menu
    revalidatePath("/")
    revalidatePath("/admin/role-permissions")

    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error adding Event Co-ordination menu:", error)
    return { success: false, error: error.message }
  }
}
