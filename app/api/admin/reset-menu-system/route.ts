import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("API route: /api/admin/reset-menu-system - Starting menu system reset")

    const supabase = createClient()

    // Execute the ensure_admin_menu_permissions function
    const { data, error } = await supabase.rpc("ensure_admin_menu_permissions")

    if (error) {
      console.error("Error resetting menu system:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Also make sure all menu items are visible
    const { error: updateError } = await supabase
      .from("menu_items")
      .update({ is_visible: true })
      .filter("is_visible", "is", null)

    if (updateError) {
      console.error("Error updating menu visibility:", updateError)
      // Continue anyway, this is not critical
    }

    console.log("API route: /api/admin/reset-menu-system - Menu system reset successful")

    return NextResponse.json({
      success: true,
      message: "Menu system has been reset successfully",
    })
  } catch (error) {
    console.error("API route: /api/admin/reset-menu-system - Error:", error)
    return NextResponse.json({ success: false, error: "Failed to reset menu system" }, { status: 500 })
  }
}
