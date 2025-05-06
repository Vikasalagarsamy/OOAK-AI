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

export async function POST(request: Request) {
  try {
    const { repair } = await request.json()

    if (!repair) {
      return NextResponse.json({ message: "No action taken" })
    }

    const supabase = createClient()

    // Check if menu_items table exists and has data
    const { count: menuItemsCount, error: countError } = await supabase
      .from("menu_items")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error checking menu_items table:", countError)
      return NextResponse.json({ error: "Failed to check menu_items table" }, { status: 500 })
    }

    // If no menu items exist, create them
    if (menuItemsCount === 0) {
      // Insert parent menu items
      const { error: parentError } = await supabase.from("menu_items").insert([
        {
          name: "Dashboard",
          description: "Main dashboard",
          icon: "LayoutDashboard",
          path: "/",
          sort_order: 10,
          is_visible: true,
        },
        {
          name: "Organization",
          description: "Organization management",
          icon: "Building2",
          path: "/organization",
          sort_order: 20,
          is_visible: true,
        },
        {
          name: "People",
          description: "People management",
          icon: "Users",
          path: "/people",
          sort_order: 30,
          is_visible: true,
        },
        {
          name: "Sales",
          description: "Sales management",
          icon: "BarChart",
          path: "/sales",
          sort_order: 40,
          is_visible: true,
        },
      ])

      if (parentError) {
        console.error("Error creating parent menu items:", parentError)
        return NextResponse.json({ error: "Failed to create parent menu items" }, { status: 500 })
      }

      // Get the IDs of the parent menu items
      const { data: parentItems, error: parentFetchError } = await supabase
        .from("menu_items")
        .select("id, name")
        .in("name", ["Dashboard", "Organization", "People", "Sales"])

      if (parentFetchError || !parentItems) {
        console.error("Error fetching parent menu items:", parentFetchError)
        return NextResponse.json({ error: "Failed to fetch parent menu items" }, { status: 500 })
      }

      // Create a map of parent names to IDs
      const parentMap = parentItems.reduce(
        (map, item) => {
          map[item.name] = item.id
          return map
        },
        {} as Record<string, number>,
      )

      // Insert child menu items for Organization
      if (parentMap["Organization"]) {
        const { error: orgChildError } = await supabase.from("menu_items").insert([
          {
            parent_id: parentMap["Organization"],
            name: "Companies",
            description: "Manage companies",
            icon: "Building",
            path: "/organization/companies",
            sort_order: 10,
            is_visible: true,
          },
          {
            parent_id: parentMap["Organization"],
            name: "Branches",
            description: "Manage branches",
            icon: "GitBranch",
            path: "/organization/branches",
            sort_order: 20,
            is_visible: true,
          },
          {
            parent_id: parentMap["Organization"],
            name: "Clients",
            description: "Manage clients",
            icon: "Users",
            path: "/organization/clients",
            sort_order: 30,
            is_visible: true,
          },
          {
            parent_id: parentMap["Organization"],
            name: "Vendors",
            description: "Manage vendors",
            icon: "Truck",
            path: "/organization/vendors",
            sort_order: 40,
            is_visible: true,
          },
          {
            parent_id: parentMap["Organization"],
            name: "Suppliers",
            description: "Manage suppliers",
            icon: "Package",
            path: "/organization/suppliers",
            sort_order: 50,
            is_visible: true,
          },
          {
            parent_id: parentMap["Organization"],
            name: "Roles",
            description: "Manage roles",
            icon: "Shield",
            path: "/organization/roles",
            sort_order: 60,
            is_visible: true,
          },
          {
            parent_id: parentMap["Organization"],
            name: "User Accounts",
            description: "Manage user accounts",
            icon: "UserCog",
            path: "/organization/user-accounts",
            sort_order: 70,
            is_visible: true,
          },
        ])

        if (orgChildError) {
          console.error("Error creating Organization child menu items:", orgChildError)
        }
      }

      // Insert child menu items for People
      if (parentMap["People"]) {
        const { error: peopleChildError } = await supabase.from("menu_items").insert([
          {
            parent_id: parentMap["People"],
            name: "Dashboard",
            description: "People dashboard",
            icon: "LayoutDashboard",
            path: "/people/dashboard",
            sort_order: 10,
            is_visible: true,
          },
          {
            parent_id: parentMap["People"],
            name: "Employees",
            description: "Manage employees",
            icon: "Users",
            path: "/people/employees",
            sort_order: 20,
            is_visible: true,
          },
          {
            parent_id: parentMap["People"],
            name: "Departments",
            description: "Manage departments",
            icon: "FolderKanban",
            path: "/people/departments",
            sort_order: 30,
            is_visible: true,
          },
          {
            parent_id: parentMap["People"],
            name: "Designations",
            description: "Manage designations",
            icon: "BadgeCheck",
            path: "/people/designations",
            sort_order: 40,
            is_visible: true,
          },
        ])

        if (peopleChildError) {
          console.error("Error creating People child menu items:", peopleChildError)
        }
      }

      // Insert child menu items for Sales
      if (parentMap["Sales"]) {
        const { error: salesChildError } = await supabase.from("menu_items").insert([
          {
            parent_id: parentMap["Sales"],
            name: "Dashboard",
            description: "Sales dashboard",
            icon: "LayoutDashboard",
            path: "/sales",
            sort_order: 10,
            is_visible: true,
          },
          {
            parent_id: parentMap["Sales"],
            name: "Create Lead",
            description: "Create new lead",
            icon: "UserPlus",
            path: "/sales/create-lead",
            sort_order: 20,
            is_visible: true,
          },
          {
            parent_id: parentMap["Sales"],
            name: "My Leads",
            description: "View my leads",
            icon: "ListChecks",
            path: "/sales/my-leads",
            sort_order: 30,
            is_visible: true,
          },
          {
            parent_id: parentMap["Sales"],
            name: "Unassigned Leads",
            description: "View unassigned leads",
            icon: "UserMinus",
            path: "/sales/unassigned-lead",
            sort_order: 40,
            is_visible: true,
          },
          {
            parent_id: parentMap["Sales"],
            name: "Follow Up",
            description: "Lead follow ups",
            icon: "PhoneCall",
            path: "/sales/follow-up",
            sort_order: 50,
            is_visible: true,
          },
          {
            parent_id: parentMap["Sales"],
            name: "Quotation",
            description: "Manage quotations",
            icon: "FileText",
            path: "/sales/quotation",
            sort_order: 60,
            is_visible: true,
          },
          {
            parent_id: parentMap["Sales"],
            name: "Order Confirmation",
            description: "Manage order confirmations",
            icon: "CheckCircle",
            path: "/sales/order-confirmation",
            sort_order: 70,
            is_visible: true,
          },
          {
            parent_id: parentMap["Sales"],
            name: "Rejected Leads",
            description: "View rejected leads",
            icon: "XCircle",
            path: "/sales/rejected-leads",
            sort_order: 80,
            is_visible: true,
          },
          {
            parent_id: parentMap["Sales"],
            name: "Lead Sources",
            description: "Manage lead sources",
            icon: "Database",
            path: "/sales/lead-sources",
            sort_order: 90,
            is_visible: true,
          },
        ])

        if (salesChildError) {
          console.error("Error creating Sales child menu items:", salesChildError)
        }
      }
    }

    // Set up permissions for Administrator role (ID 1)
    // First, get all menu items
    const { data: allMenuItems, error: menuFetchError } = await supabase.from("menu_items").select("id")

    if (menuFetchError || !allMenuItems) {
      console.error("Error fetching all menu items:", menuFetchError)
      return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 })
    }

    // Clear existing permissions for Administrator
    const { error: deleteError } = await supabase.from("role_menu_permissions").delete().eq("role_id", 1)

    if (deleteError) {
      console.error("Error clearing existing permissions:", deleteError)
    }

    // Create permissions for all menu items
    const permissionsToInsert = allMenuItems.map((item) => ({
      role_id: 1,
      menu_item_id: item.id,
      can_view: true,
      can_add: true,
      can_edit: true,
      can_delete: true,
    }))

    const { error: permissionError } = await supabase.from("role_menu_permissions").insert(permissionsToInsert)

    if (permissionError) {
      console.error("Error setting up permissions:", permissionError)
      return NextResponse.json({ error: "Failed to set up permissions" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Menu system repaired successfully",
      details: {
        menuItemsCreated: menuItemsCount === 0,
        permissionsSet: true,
      },
    })
  } catch (error) {
    console.error("Error in menu-check API:", error)
    return NextResponse.json({ error: "An error occurred while checking the menu system" }, { status: 500 })
  }
}
