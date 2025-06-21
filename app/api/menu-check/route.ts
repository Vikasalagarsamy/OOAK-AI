import { NextResponse } from "next/server"
import { query, transaction } from "@/lib/postgresql-client"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET() {
  try {
    console.log('🧩 [MENU CHECK] Running menu system checks via PostgreSQL...')
    
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
    try {
      const roleResult = await query(`
        SELECT id, title
        FROM roles
        WHERE id = $1
      `, [user.roleId])

      if (roleResult.rows.length === 0) {
        checks.push({
          name: "User Role Check",
          status: "error",
          message: `User has invalid role ID: ${user.roleId}`,
        })
      } else {
        const roleData = roleResult.rows[0]
        checks.push({
          name: "User Role Check",
          status: "success",
          message: `User has valid role: ${roleData.title} (ID: ${roleData.id})`,
        })
        isAdmin = roleData.title === "Administrator"
      }
    } catch (roleError) {
      checks.push({
        name: "User Role Check",
        status: "error",
        message: `Error checking user role: ${roleError.message}`,
      })
    }

    // Check 2: Menu items table exists and has records
    try {
      const menuResult = await query(`
        SELECT COUNT(*) as count
        FROM menu_items
      `)
      
      const menuCount = parseInt(menuResult.rows[0].count)
      
      if (menuCount === 0) {
        checks.push({
          name: "Menu Items Data Check",
          status: "error",
          message: "Menu items table exists but contains no records",
        })
      } else {
        checks.push({
          name: "Menu Items Table Check",
          status: "success",
          message: `Menu items table exists with ${menuCount} records`,
        })
      }
    } catch (menuError) {
      checks.push({
        name: "Menu Items Table Check",
        status: "error",
        message: "Menu items table not found or inaccessible",
      })
    }

    // Check 3: Role menu permissions table exists
    try {
      const permissionCheckResult = await query(`
        SELECT COUNT(*) as count
        FROM role_menu_permissions
        LIMIT 1
      `)
      
      checks.push({
        name: "Permissions Table Check",
        status: "success",
        message: "Role menu permissions table exists",
      })
    } catch (permissionCheckError) {
      checks.push({
        name: "Permissions Table Check",
        status: "error",
        message: "Role menu permissions table not found or inaccessible",
      })
    }

    // Check 4: User's role has permissions assigned
    try {
      const rolePermissionsResult = await query(`
        SELECT COUNT(*) as count
        FROM role_menu_permissions
        WHERE role_id = $1
      `, [user.roleId])
      
      const permissionCount = parseInt(rolePermissionsResult.rows[0].count)
      
      if (permissionCount === 0 && !isAdmin) {
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
            : `Role has ${permissionCount} permission entries`,
        })
      }
    } catch (rolePermissionsError) {
      checks.push({
        name: "Role Permissions Check",
        status: "error",
        message: "Could not check role permissions",
      })
    }

    // Calculate overall status
    const hasErrors = checks.some((check) => check.status === "error")

    console.log(`✅ [MENU CHECK] Menu system check completed via PostgreSQL: ${hasErrors ? 'ISSUES FOUND' : 'ALL GOOD'}`)

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
    console.error("❌ Error in menu check API (PostgreSQL):", error)
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

export async function POST(request: Request) {
  try {
    console.log('🧩 [MENU CHECK] Running menu repair via PostgreSQL...')
    
    const { repair } = await request.json()

    if (!repair) {
      return NextResponse.json({ message: "No action taken" })
    }

    // Check if menu_items table exists and has data
    const countResult = await query(`
      SELECT COUNT(*) as count
      FROM menu_items
    `)
    
    const menuItemsCount = parseInt(countResult.rows[0].count)

    // If no menu items exist, create them
    if (menuItemsCount === 0) {
      console.log('🧩 [MENU CHECK] Creating default menu items...')
      
      // Insert parent menu items
      await query(`
        INSERT INTO menu_items (
          name, description, icon, path, sort_order, is_visible
        ) VALUES
        ('Dashboard', 'Main dashboard', 'LayoutDashboard', '/', 10, true),
        ('Organization', 'Organization management', 'Building2', '/organization', 20, true),
        ('People', 'People management', 'Users', '/people', 30, true),
        ('Sales', 'Sales management', 'BarChart', '/sales', 40, true)
      `)

      console.log('✅ [MENU CHECK] Default menu items created via PostgreSQL')

      return NextResponse.json({
        success: true,
        message: "Menu system repaired successfully",
        actions: ["Created default menu items"]
      })
    }

    return NextResponse.json({
      success: true,
      message: "Menu system already has data, no repair needed"
    })

  } catch (error: any) {
    console.error("❌ Error in menu repair API (PostgreSQL):", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to repair menu system"
      },
      { status: 500 }
    )
  }
}
