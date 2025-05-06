import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET() {
  try {
    const supabase = createClient()
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          message: "Not authenticated",
          checks: [],
        },
        { status: 401 },
      )
    }

    const checks = []
    let isAdmin = false

    // Check 1: Verify user has a valid role
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id, title")
      .eq("id", user.roleId)
      .single()

    if (roleError) {
      checks.push({
        name: "User Role Check",
        status: "error",
        message: `User has invalid role ID: ${user.roleId}`,
      })
    } else {
      checks.push({
        name: "User Role Check",
        status: "success",
        message: `User has valid role: ${roleData.title} (ID: ${roleData.id})`,
      })

      isAdmin = roleData.title === "Administrator"
    }

    // Check 2: Menu items table exists and has records
    const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("id")

    if (menuError) {
      checks.push({
        name: "Menu Items Table Check",
        status: "error",
        message: "Menu items table not found or inaccessible",
      })
    } else if (menuItems.length === 0) {
      checks.push({
        name: "Menu Items Data Check",
        status: "error",
        message: "Menu items table exists but contains no records",
      })
    } else {
      checks.push({
        name: "Menu Items Table Check",
        status: "success",
        message: `Menu items table exists with ${menuItems.length} records`,
      })
    }

    // Check 3: Role menu permissions table exists
    const { data: permissionCheck, error: permissionCheckError } = await supabase
      .from("role_menu_permissions")
      .select("id")
      .limit(1)

    if (permissionCheckError) {
      checks.push({
        name: "Permissions Table Check",
        status: "error",
        message: "Role menu permissions table not found or inaccessible",
      })
    } else {
      checks.push({
        name: "Permissions Table Check",
        status: "success",
        message: "Role menu permissions table exists",
      })
    }

    // Check 4: User's role has permissions assigned
    const { data: rolePermissions, error: rolePermissionsError } = await supabase
      .from("role_menu_permissions")
      .select("id")
      .eq("role_id", user.roleId)

    if (rolePermissionsError) {
      checks.push({
        name: "Role Permissions Check",
        status: "error",
        message: "Could not check role permissions",
      })
    } else if (rolePermissions.length === 0 && !isAdmin) {
      checks.push({
        name: "Role Permissions Check",
        status: "error",
        message: "No menu permissions assigned to user's role",
      })
    } else {
      checks.push({
        name: "Role Permissions Check",
        status: "success",
        message: isAdmin
          ? "Admin role detected, permissions should be automatically granted"
          : `Role has ${rolePermissions.length} permission entries`,
      })
    }

    // Calculate overall status
    const hasErrors = checks.some((check) => check.status === "error")

    return NextResponse.json({
      status: hasErrors ? "error" : "success",
      message: hasErrors ? "Issues detected with menu system" : "Menu system configuration looks good",
      checks,
      user: {
        id: user.id,
        roleId: user.roleId,
        isAdmin,
      },
    })
  } catch (error: any) {
    console.error("Error in menu check API:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "An error occurred when checking menu system",
        checks: [],
      },
      { status: 500 },
    )
  }
}
