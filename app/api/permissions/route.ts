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

    // Use our new database function to check permissions
    const supabase = createClient()

    // Check each permission type
    const [viewResult, addResult, editResult, deleteResult] = await Promise.all([
      supabase.rpc("check_user_menu_permission", { p_user_id: user.id, p_menu_path: path, p_permission: "view" }),
      supabase.rpc("check_user_menu_permission", { p_user_id: user.id, p_menu_path: path, p_permission: "add" }),
      supabase.rpc("check_user_menu_permission", { p_user_id: user.id, p_menu_path: path, p_permission: "edit" }),
      supabase.rpc("check_user_menu_permission", { p_user_id: user.id, p_menu_path: path, p_permission: "delete" }),
    ])

    // Handle any errors
    if (viewResult.error || addResult.error || editResult.error || deleteResult.error) {
      console.error(
        "Error checking permissions:",
        viewResult.error || addResult.error || editResult.error || deleteResult.error,
      )
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
        canView: viewResult.data || false,
        canAdd: addResult.data || false,
        canEdit: editResult.data || false,
        canDelete: deleteResult.data || false,
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
