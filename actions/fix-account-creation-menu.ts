"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function fixAccountCreationMenu() {
  const supabase = createClient()

  try {
    // First, check if the account creation menu item exists
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, parent_id, name, path, is_visible")
      .or("name.ilike.%Account Creation%,path.eq./organization/account-creation")

    if (menuError) throw menuError

    // Get the organization menu item
    const { data: orgItems, error: orgError } = await supabase
      .from("menu_items")
      .select("id")
      .or("name.eq.Organization,path.eq./organization")
      .single()

    if (orgError && orgError.code !== "PGRST116") throw orgError // PGRST116 is "no rows returned"

    const organizationId = orgItems?.id

    if (!organizationId) {
      // Create organization menu item if it doesn't exist
      const { data: newOrg, error: createOrgError } = await supabase
        .from("menu_items")
        .insert({
          parent_id: null,
          name: "Organization",
          path: "/organization",
          icon: "building",
          is_visible: true,
          sort_order: 20,
        })
        .select("id")
        .single()

      if (createOrgError) throw createOrgError

      console.log("Created Organization menu item:", newOrg)
    }

    // Check if account creation menu item exists
    const accountCreationItem = menuItems?.find(
      (item) => item.name === "Account Creation" || item.path === "/organization/account-creation",
    )

    if (!accountCreationItem) {
      // Create account creation menu item
      const { data: newItem, error: createError } = await supabase
        .from("menu_items")
        .insert({
          parent_id: organizationId,
          name: "Account Creation",
          path: "/organization/account-creation",
          icon: "user-plus",
          is_visible: true,
          sort_order: 70,
        })
        .select("id")
        .single()

      if (createError) throw createError

      console.log("Created Account Creation menu item:", newItem)

      // Get admin role
      const { data: adminRole, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .or("title.eq.Administrator,title.eq.Admin")
        .single()

      if (roleError && roleError.code !== "PGRST116") throw roleError

      if (adminRole) {
        // Add permissions for admin role
        const { error: permError } = await supabase.from("role_menu_permissions").insert({
          role_id: adminRole.id,
          menu_item_id: newItem.id,
          can_view: true,
          can_add: true,
          can_edit: true,
          can_delete: true,
        })

        if (permError) throw permError

        console.log("Added permissions for admin role")
      }
    } else {
      // Update existing account creation menu item
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({
          parent_id: organizationId,
          is_visible: true,
          path: "/organization/account-creation",
          icon: accountCreationItem.path ? accountCreationItem.path : "user-plus",
        })
        .eq("id", accountCreationItem.id)

      if (updateError) throw updateError

      console.log("Updated Account Creation menu item")

      // Get admin role
      const { data: adminRole, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .or("title.eq.Administrator,title.eq.Admin")
        .single()

      if (roleError && roleError.code !== "PGRST116") throw roleError

      if (adminRole) {
        // Check if permission exists
        const { data: existingPerm, error: permCheckError } = await supabase
          .from("role_menu_permissions")
          .select("id")
          .eq("role_id", adminRole.id)
          .eq("menu_item_id", accountCreationItem.id)

        if (permCheckError) throw permCheckError

        if (existingPerm && existingPerm.length > 0) {
          // Update permission
          const { error: updatePermError } = await supabase
            .from("role_menu_permissions")
            .update({
              can_view: true,
              can_add: true,
              can_edit: true,
              can_delete: true,
            })
            .eq("role_id", adminRole.id)
            .eq("menu_item_id", accountCreationItem.id)

          if (updatePermError) throw updatePermError

          console.log("Updated permissions for admin role")
        } else {
          // Add permission
          const { error: addPermError } = await supabase.from("role_menu_permissions").insert({
            role_id: adminRole.id,
            menu_item_id: accountCreationItem.id,
            can_view: true,
            can_add: true,
            can_edit: true,
            can_delete: true,
          })

          if (addPermError) throw addPermError

          console.log("Added permissions for admin role")
        }
      }
    }

    // Revalidate paths to refresh the menu
    revalidatePath("/")
    revalidatePath("/organization")
    revalidatePath("/organization/account-creation")

    return { success: true, message: "Account Creation menu item fixed successfully" }
  } catch (error: any) {
    console.error("Error fixing account creation menu:", error)
    return {
      success: false,
      message: `Error fixing account creation menu: ${error.message || "Unknown error"}`,
    }
  }
}
