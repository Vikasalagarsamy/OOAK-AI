"use server"

import { createClient } from "@/lib/supabase"
import { refreshUserSession } from "./auth-actions"

export async function resetMenuSystem() {
  try {
    const supabase = createClient()

    // 1. Make all menu items visible
    const { error: visibilityError } = await supabase
      .from("menu_items")
      .update({ is_visible: true })
      .eq("is_visible", false)

    if (visibilityError) throw visibilityError

    // 2. Ensure Administrator role has all permissions
    // First, get all menu items
    const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("id")

    if (menuError) throw menuError

    // Then, ensure permissions exist for each menu item
    for (const item of menuItems) {
      const { data: existing, error: checkError } = await supabase
        .from("role_menu_permissions")
        .select("id")
        .eq("role_id", 1) // Administrator role
        .eq("menu_item_id", item.id)
        .maybeSingle()

      if (checkError) throw checkError

      if (!existing) {
        // Insert missing permission
        const { error: insertError } = await supabase.from("role_menu_permissions").insert({
          role_id: 1,
          menu_item_id: item.id,
          can_view: true,
          can_add: true,
          can_edit: true,
          can_delete: true,
        })

        if (insertError) throw insertError
      } else {
        // Update existing permission
        const { error: updateError } = await supabase
          .from("role_menu_permissions")
          .update({
            can_view: true,
            can_add: true,
            can_edit: true,
            can_delete: true,
          })
          .eq("role_id", 1)
          .eq("menu_item_id", item.id)

        if (updateError) throw updateError
      }
    }

    // 3. Refresh the user session
    const refreshResult = await refreshUserSession()

    if (!refreshResult.success) {
      throw new Error(refreshResult.error || "Failed to refresh session")
    }

    return {
      success: true,
      message: "Menu system reset successfully",
      itemsCount: menuItems.length,
    }
  } catch (error) {
    console.error("Error resetting menu system:", error)
    return {
      success: false,
      error: String(error),
    }
  }
}
