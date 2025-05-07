import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const path = url.searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "Path parameter is required" }, { status: 400 })
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { canView: false, canAdd: false, canEdit: false, canDelete: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    // Admin has all permissions
    if (user.isAdmin || user.roleId === 1) {
      return NextResponse.json(
        { canView: true, canAdd: true, canEdit: true, canDelete: true },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    // Get menu item by path
    const supabase = createClient()
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .select("id")
      .eq("path", path)
      .single()

    if (menuError || !menuItem) {
      console.error("Error finding menu item for path:", path, menuError)
      return NextResponse.json(
        { canView: false, canAdd: false, canEdit: false, canDelete: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    // Get permissions for this menu item and role
    const { data: permission, error: permError } = await supabase
      .from("role_menu_permissions")
      .select("can_view, can_add, can_edit, can_delete")
      .eq("role_id", user.roleId)
      .eq("menu_item_id", menuItem.id)
      .single()

    if (permError) {
      console.error("Error finding permissions:", permError)
      return NextResponse.json(
        { canView: false, canAdd: false, canEdit: false, canDelete: false },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    }

    // Return permissions
    return NextResponse.json(
      {
        canView: permission?.can_view || false,
        canAdd: permission?.can_add || false,
        canEdit: permission?.can_edit || false,
        canDelete: permission?.can_delete || false,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Error in permissions API:", error)
    return NextResponse.json({ error: "Failed to check permissions" }, { status: 500 })
  }
}
