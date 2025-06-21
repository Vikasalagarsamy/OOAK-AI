"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

export async function addEventCoordinationMenu() {
  try {
    console.log("🗃️ Adding Event Co-ordination menu using PostgreSQL...")

    let mainMenuId: number

    await transaction(async (client) => {
      // Step 1: Add the main Event Co-ordination menu item
      const mainMenuResult = await client.query(
        `INSERT INTO menu_items (
          name, path, icon, parent_id, sort_order, is_visible, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id`,
        [
          "Event Co-ordination",
          "/events", 
          "Calendar",
          null,
          100, // A high number to ensure it appears at the end
          true,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      )

      if (!mainMenuResult.rows || mainMenuResult.rows.length === 0) {
        throw new Error("Failed to create main Event Co-ordination menu item")
      }

      mainMenuId = mainMenuResult.rows[0].id
      console.log(`✅ Created main menu item with ID: ${mainMenuId}`)

      // Step 2: Add sub-menu items
      const subMenuItems = [
        {
          name: "Event Dashboard",
          path: "/events/dashboard",
          icon: "LayoutDashboard",
          sort_order: 1,
        },
        {
          name: "Event Calendar",
          path: "/events/calendar",
          icon: "CalendarDays",
          sort_order: 2,
        },
        {
          name: "Create Event",
          path: "/events/create",
          icon: "PlusCircle",
          sort_order: 3,
        },
        {
          name: "Event Types",
          path: "/events/types",
          icon: "Tags",
          sort_order: 4,
        },
        {
          name: "Event Reports",
          path: "/events/reports",
          icon: "BarChart",
          sort_order: 5,
        },
      ]

      // Insert all sub-menu items in batch
      const values: any[] = []
      const placeholders: string[] = []
      
      subMenuItems.forEach((item, index) => {
        const baseIndex = index * 8
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`)
        values.push(
          item.name,
          item.path,
          item.icon,
          mainMenuId,
          item.sort_order,
          true,
          new Date().toISOString(),
          new Date().toISOString()
        )
      })

      await client.query(
        `INSERT INTO menu_items (name, path, icon, parent_id, sort_order, is_visible, created_at, updated_at) 
         VALUES ${placeholders.join(', ')}`,
        values
      )

      console.log(`✅ Created ${subMenuItems.length} sub-menu items`)

      // Step 3: Get all menu items related to Event Co-ordination  
      const allEventMenuItemsResult = await client.query(
        "SELECT id FROM menu_items WHERE id = $1 OR parent_id = $1",
        [mainMenuId]
      )

      if (!allEventMenuItemsResult.rows || allEventMenuItemsResult.rows.length === 0) {
        throw new Error("Failed to retrieve Event Co-ordination menu items")
      }

      const allEventMenuItems = allEventMenuItemsResult.rows

      // Step 4: Get all roles
      const rolesResult = await client.query("SELECT id FROM roles")

      if (!rolesResult.rows || rolesResult.rows.length === 0) {
        throw new Error("No roles found in the system")
      }

      const roles = rolesResult.rows

      // Step 5: Create permissions for all roles and menu items in batch
      const permissionValues: any[] = []
      const permissionPlaceholders: string[] = []

      let permissionIndex = 0
      for (const role of roles) {
        for (const menuItem of allEventMenuItems) {
          const baseIndex = permissionIndex * 8
          permissionPlaceholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`)
          
          permissionValues.push(
            role.id,
            menuItem.id,
            role.id === 1, // Only admin can view by default
            role.id === 1, // Only admin can add by default
            role.id === 1, // Only admin can edit by default
            role.id === 1, // Only admin can delete by default
            new Date().toISOString(),
            new Date().toISOString()
          )
          permissionIndex++
        }
      }

      // Insert all permissions in batch
      await client.query(
        `INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete, created_at, updated_at) 
         VALUES ${permissionPlaceholders.join(', ')}`,
        permissionValues
      )

      console.log(`✅ Created ${permissionIndex} role permissions`)
    })

    // Revalidate paths to refresh the menu
    revalidatePath("/")
    revalidatePath("/admin/role-permissions")

    console.log("✅ Event Co-ordination menu added successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Error adding Event Co-ordination menu:", error)
    return { success: false, error: error.message }
  }
}
