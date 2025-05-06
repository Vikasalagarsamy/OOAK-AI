import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "Path parameter is required" }, { status: 400 })
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        },
        { status: 200 },
      )
    }

    // Administrator always has all permissions
    if (user.isAdmin) {
      return NextResponse.json(
        {
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true,
        },
        { status: 200 },
      )
    }

    const supabase = createClient()

    // First, find the menu item by path
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .select("id")
      .eq("path", path)
      .single()

    if (menuError || !menuItem) {
      return NextResponse.json(
        {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        },
        { status: 200 },
      )
    }

    // Then, get the permissions for this menu item and role
    const { data: permissions, error: permissionsError } = await supabase
      .from("role_menu_permissions")
      .select("can_view, can_add, can_edit, can_delete")
      .eq("role_id", user.roleId)
      .eq("menu_item_id", menuItem.id)
      .single()

    if (permissionsError || !permissions) {
      return NextResponse.json(
        {
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        },
        { status: 200 },
      )
    }

    return NextResponse.json(
      {
        canView: permissions.can_view,
        canAdd: permissions.can_add,
        canEdit: permissions.can_edit,
        canDelete: permissions.can_delete,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in permissions API:", error)
    return NextResponse.json({ error: "Failed to check permissions" }, { status: 500 })
  }
}
