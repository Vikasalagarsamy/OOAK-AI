import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createClient()

    // Get menu items count
    const { count: menuItemsCount, error: countError } = await supabase
      .from("menu_items")
      .select("*", { count: "exact", head: true })

    if (countError) throw countError

    // Get permissions count
    const { count: permissionsCount, error: permError } = await supabase
      .from("role_menu_permissions")
      .select("*", { count: "exact", head: true })

    if (permError) throw permError

    // Check for menu items without permissions
    const { data: missingPermissions, error: missingError } = await supabase.from("menu_items").select("id, name").not(
      "id",
      "in",
      supabase
        .from("role_menu_permissions")
        .select("menu_item_id")
        .eq("role_id", 1), // Administrator role
    )

    if (missingError) throw missingError

    // Check for orphaned menu items
    const { data: orphanedItems, error: orphanedError } = await supabase
      .from("menu_items")
      .select("id, name, parent_id")
      .not("parent_id", "is", null)
      .not("parent_id", "in", supabase.from("menu_items").select("id"))

    if (orphanedError) throw orphanedError

    // Determine overall health
    const hasIssues = (missingPermissions?.length || 0) > 0 || (orphanedItems?.length || 0) > 0

    return NextResponse.json({
      status: hasIssues ? "warning" : "healthy",
      menuItems: menuItemsCount,
      permissions: permissionsCount,
      issues: {
        missingPermissions: missingPermissions?.length || 0,
        orphanedItems: orphanedItems?.length || 0,
      },
      details: {
        missingPermissions: missingPermissions || [],
        orphanedItems: orphanedItems || [],
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Menu health check failed:", error)
    return NextResponse.json(
      { status: "error", message: "Failed to check menu health", error: String(error) },
      { status: 500 },
    )
  }
}
