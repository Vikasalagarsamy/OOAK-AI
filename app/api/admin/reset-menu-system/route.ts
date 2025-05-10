import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST() {
  try {
    const supabase = createClient()

    // 1. Reset all menu permissions for Administrator role
    // First, get the Administrator role ID
    const { data: adminRole, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("title", "Administrator")
      .single()

    if (roleError) {
      console.error("Error finding Administrator role:", roleError)
      return NextResponse.json({ error: "Failed to find Administrator role" }, { status: 500 })
    }

    // Get all menu items
    const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("id")

    if (menuError) {
      console.error("Error fetching menu items:", menuError)
      return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 })
    }

    // Delete existing permissions for Administrator
    const { error: deleteError } = await supabase.from("role_menu_permissions").delete().eq("role_id", adminRole.id)

    if (deleteError) {
      console.error("Error deleting existing permissions:", deleteError)
      return NextResponse.json({ error: "Failed to reset permissions" }, { status: 500 })
    }

    // Create new permissions with full access for all menu items
    const permissionsToInsert = menuItems.map((item) => ({
      role_id: adminRole.id,
      menu_item_id: item.id,
      can_view: true,
      can_add: true,
      can_edit: true,
      can_delete: true,
    }))

    const { error: insertError } = await supabase.from("role_menu_permissions").insert(permissionsToInsert)

    if (insertError) {
      console.error("Error inserting new permissions:", insertError)
      return NextResponse.json({ error: "Failed to create new permissions" }, { status: 500 })
    }

    // 2. Ensure all menu items are visible
    const { error: visibilityError } = await supabase
      .from("menu_items")
      .update({ is_visible: true })
      .eq("is_visible", false)

    if (visibilityError) {
      console.error("Error updating menu visibility:", visibilityError)
      return NextResponse.json({ error: "Failed to update menu visibility" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Menu system reset successfully. Please refresh the page to see the changes.",
    })
  } catch (error) {
    console.error("Error in reset-menu-system API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
