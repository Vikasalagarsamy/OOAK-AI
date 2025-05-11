import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { menuStructure } from "@/lib/menu-structure"

export async function POST() {
  try {
    const supabase = createClient()

    // Get all existing menu items
    const { data: existingMenuItems, error: fetchError } = await supabase.from("menu_items").select("id, name, path")

    if (fetchError) {
      console.error("Error fetching existing menu items:", fetchError)
      return NextResponse.json({ error: "Failed to fetch existing menu items" }, { status: 500 })
    }

    // Create a map of existing items by path for quick lookup
    const existingItemsByPath = new Map()
    existingMenuItems?.forEach((item) => {
      if (item.path) {
        existingItemsByPath.set(item.path, item)
      }
    })

    // Process the menu structure from the code
    const menuUpdates = []
    let sortOrder = 10

    // Process top-level items
    for (const [name, menuItem] of Object.entries(menuStructure)) {
      // Check if this item exists
      const existingItem = existingItemsByPath.get(menuItem.path)

      if (!existingItem) {
        // Create new top-level item
        menuUpdates.push({
          name,
          path: menuItem.path,
          icon: menuItem.icon,
          parent_id: null,
          is_visible: true,
          sort_order: sortOrder,
        })
      }

      sortOrder += 10

      // Process sub-menus
      if (menuItem.subMenus && menuItem.subMenus.length > 0) {
        let subSortOrder = 10

        for (const subMenu of menuItem.subMenus) {
          // Check if this sub-item exists
          const existingSubItem = existingItemsByPath.get(subMenu.path)

          if (!existingSubItem) {
            // Find parent ID
            const parentItem = existingItemsByPath.get(menuItem.path)

            // Create new sub-item
            menuUpdates.push({
              name: subMenu.name,
              path: subMenu.path,
              icon: subMenu.icon,
              parent_id: parentItem?.id || null, // Will be updated after parent is created
              is_visible: true,
              sort_order: subSortOrder,
            })
          }

          subSortOrder += 10
        }
      }
    }

    // Insert new menu items
    if (menuUpdates.length > 0) {
      const { error: insertError } = await supabase.from("menu_items").insert(menuUpdates)

      if (insertError) {
        console.error("Error inserting new menu items:", insertError)
        return NextResponse.json({ error: "Failed to insert new menu items" }, { status: 500 })
      }
    }

    // Now we need to update parent IDs for sub-items
    // This requires a second pass after all items are created

    // Get all menu items again
    const { data: updatedMenuItems, error: refetchError } = await supabase.from("menu_items").select("id, name, path")

    if (refetchError) {
      console.error("Error refetching menu items:", refetchError)
      return NextResponse.json({ error: "Failed to refetch menu items" }, { status: 500 })
    }

    // Create maps for quick lookup
    const itemsByPath = new Map()
    updatedMenuItems?.forEach((item) => {
      if (item.path) {
        itemsByPath.set(item.path, item)
      }
    })

    // Update parent IDs
    const parentUpdates = []

    for (const [name, menuItem] of Object.entries(menuStructure)) {
      const parentItem = itemsByPath.get(menuItem.path)

      if (parentItem && menuItem.subMenus && menuItem.subMenus.length > 0) {
        for (const subMenu of menuItem.subMenus) {
          const subItem = itemsByPath.get(subMenu.path)

          if (subItem && (!subItem.parent_id || subItem.parent_id !== parentItem.id)) {
            parentUpdates.push({
              id: subItem.id,
              parent_id: parentItem.id,
            })
          }
        }
      }
    }

    // Update parent IDs
    if (parentUpdates.length > 0) {
      for (const update of parentUpdates) {
        const { error: updateError } = await supabase
          .from("menu_items")
          .update({ parent_id: update.parent_id })
          .eq("id", update.id)

        if (updateError) {
          console.error(`Error updating parent ID for item ${update.id}:`, updateError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Menu structure synchronized successfully",
      newItems: menuUpdates.length,
      parentUpdates: parentUpdates.length,
    })
  } catch (error) {
    console.error("Error synchronizing menu structure:", error)
    return NextResponse.json({ error: "Failed to synchronize menu structure" }, { status: 500 })
  }
}
