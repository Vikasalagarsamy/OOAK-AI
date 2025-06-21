"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"

interface MenuItem {
  id: number
  parent_id: number | null
  name: string
  path: string
  is_visible: boolean
}

export async function fixAccountCreationMenu() {
  try {
    console.log("🔧 [MENU] Starting Account Creation menu fix via PostgreSQL...")

    const result = await transaction(async (client) => {
      // First, check if the account creation menu item exists
      console.log("🔍 [MENU] Checking for existing Account Creation menu items...")
      const menuItemsResult = await client.query(`
        SELECT id, parent_id, name, path, is_visible
        FROM menu_items 
        WHERE name ILIKE '%Account Creation%' OR path = '/organization/account-creation'
      `)

      const menuItems: MenuItem[] = menuItemsResult.rows

      // Get the organization menu item
      console.log("🔍 [MENU] Looking for Organization menu item...")
      const orgResult = await client.query(`
        SELECT id FROM menu_items 
        WHERE name = 'Organization' OR path = '/organization'
        LIMIT 1
      `)

      let organizationId = orgResult.rows[0]?.id

      if (!organizationId) {
        // Create organization menu item if it doesn't exist
        console.log("➕ [MENU] Creating Organization menu item...")
        const newOrgResult = await client.query(`
          INSERT INTO menu_items (parent_id, name, path, icon, is_visible, sort_order)
          VALUES (NULL, 'Organization', '/organization', 'building', true, 20)
          RETURNING id
        `)
        organizationId = newOrgResult.rows[0].id
        console.log(`✅ [MENU] Created Organization menu item with ID: ${organizationId}`)
      }

      // Check if account creation menu item exists
      const accountCreationItem = menuItems.find(
        (item: MenuItem) => item.name === "Account Creation" || item.path === "/organization/account-creation"
      )

      let menuItemId: number

      if (!accountCreationItem) {
        // Create account creation menu item
        console.log("➕ [MENU] Creating Account Creation menu item...")
        const newItemResult = await client.query(`
          INSERT INTO menu_items (parent_id, name, path, icon, is_visible, sort_order)
          VALUES ($1, 'Account Creation', '/organization/account-creation', 'user-plus', true, 70)
          RETURNING id
        `, [organizationId])

        menuItemId = newItemResult.rows[0].id
        console.log(`✅ [MENU] Created Account Creation menu item with ID: ${menuItemId}`)
      } else {
        // Update existing account creation menu item
        console.log(`📝 [MENU] Updating existing Account Creation menu item ID: ${accountCreationItem.id}`)
        await client.query(`
          UPDATE menu_items SET
            parent_id = $1,
            is_visible = true,
            path = '/organization/account-creation',
            icon = COALESCE(NULLIF(icon, ''), 'user-plus')
          WHERE id = $2
        `, [organizationId, accountCreationItem.id])

        menuItemId = accountCreationItem.id
        console.log("✅ [MENU] Updated Account Creation menu item")
      }

      // Get admin role
      console.log("🔍 [MENU] Looking for admin role...")
      const adminRoleResult = await client.query(`
        SELECT id FROM roles 
        WHERE title IN ('Administrator', 'Admin')
        LIMIT 1
      `)

      const adminRole = adminRoleResult.rows[0]

      if (adminRole) {
        console.log(`👤 [MENU] Found admin role with ID: ${adminRole.id}`)

        // Check if permission exists
        const existingPermResult = await client.query(`
          SELECT id FROM role_menu_permissions 
          WHERE role_id = $1 AND menu_item_id = $2
        `, [adminRole.id, menuItemId])

        if (existingPermResult.rows.length > 0) {
          // Update existing permission
          console.log("📝 [MENU] Updating existing admin permissions...")
          await client.query(`
            UPDATE role_menu_permissions SET
              can_view = true,
              can_add = true,
              can_edit = true,
              can_delete = true
            WHERE role_id = $1 AND menu_item_id = $2
          `, [adminRole.id, menuItemId])
          console.log("✅ [MENU] Updated admin permissions")
        } else {
          // Add new permission
          console.log("➕ [MENU] Adding new admin permissions...")
          await client.query(`
            INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
            VALUES ($1, $2, true, true, true, true)
          `, [adminRole.id, menuItemId])
          console.log("✅ [MENU] Added admin permissions")
        }
      } else {
        console.log("⚠️ [MENU] No admin role found - skipping permission setup")
      }

      return { success: true, menuItemId, organizationId }
    })

    // Revalidate paths to refresh the menu
    console.log("🔄 [MENU] Revalidating menu paths...")
    revalidatePath("/")
    revalidatePath("/organization")
    revalidatePath("/organization/account-creation")

    console.log("🎉 [MENU] Account Creation menu fix completed successfully!")
    return { 
      success: true, 
      message: "Account Creation menu item fixed successfully",
      details: {
        menuItemId: result.menuItemId,
        organizationId: result.organizationId
      }
    }
  } catch (error: any) {
    console.error("❌ [MENU] Error fixing account creation menu:", error)
    return {
      success: false,
      message: `Error fixing account creation menu: ${error.message || "Unknown error"}`,
      error: error.message
    }
  }
}
