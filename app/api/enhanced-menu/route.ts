import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import type { MenuItemWithPermission } from "@/types/menu"

// Default menu items to show when not authenticated or when there's an error
const defaultMenuItems: MenuItemWithPermission[] = [
  {
    id: 1,
    name: "Dashboard",
    path: "/dashboard",
    icon: "layout-dashboard",
    parentId: null,
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  },
  {
    id: 2,
    name: "Organization",
    path: "/organization",
    icon: "building",
    parentId: null,
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
    children: [
      {
        id: 21,
        name: "Companies",
        path: "/organization/companies",
        icon: "building-2",
        parentId: 2,
        permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
      {
        id: 22,
        name: "Branches",
        path: "/organization/branches",
        icon: "git-branch",
        parentId: 2,
        permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
      {
        id: 23,
        name: "Vendors",
        path: "/organization/vendors",
        icon: "truck",
        parentId: 2,
        permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
      {
        id: 24,
        name: "Suppliers",
        path: "/organization/suppliers",
        icon: "package",
        parentId: 2,
        permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
      {
        id: 25,
        name: "Clients",
        path: "/organization/clients",
        icon: "users",
        parentId: 2,
        permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
      {
        id: 26,
        name: "Roles",
        path: "/organization/roles",
        icon: "shield",
        parentId: 2,
        permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
      {
        id: 27,
        name: "User Accounts",
        path: "/organization/user-accounts",
        icon: "user-cog",
        parentId: 2,
        permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
      {
        id: 28,
        name: "Account Creation",
        path: "/organization/account-creation",
        icon: "user-plus",
        parentId: 2,
        permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
      },
    ],
  },
  {
    id: 3,
    name: "People",
    path: "/people",
    icon: "users",
    parentId: null,
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  },
  {
    id: 4,
    name: "Sales",
    path: "/sales",
    icon: "trending-up",
    parentId: null,
    permissions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  },
]

export async function GET() {
  try {
    const supabase = createClient()

    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session, return default menu items instead of an error
    if (!session) {
      console.log("No authenticated session found, returning default menu")
      return NextResponse.json({
        items: defaultMenuItems,
        isAuthenticated: false,
      })
    }

    // Try to fetch menu items from the database
    try {
      const { data: menuItems, error: menuError } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true })

      if (menuError) {
        console.error("Error fetching menu items:", menuError)
        throw menuError
      }

      if (!menuItems || menuItems.length === 0) {
        console.log("No menu items found in database, using default menu")
        return NextResponse.json({
          items: defaultMenuItems,
          isAuthenticated: true,
        })
      }

      // Transform the data to the expected format
      const formattedItems: MenuItemWithPermission[] = menuItems.map((item) => {
        return {
          id: item.id,
          name: item.name,
          path: item.path,
          icon: item.icon,
          parentId: item.parent_id,
          sortOrder: item.sort_order,
          permissions: {
            canView: true,
            canCreate: false,
            canEdit: false,
            canDelete: false,
          },
        }
      })

      // Build the menu hierarchy
      const menuHierarchy = buildMenuHierarchy(formattedItems)

      return NextResponse.json({
        items: menuHierarchy,
        isAuthenticated: true,
      })
    } catch (dbError) {
      console.error("Database error, falling back to default menu:", dbError)
      return NextResponse.json({
        items: defaultMenuItems,
        isAuthenticated: true,
        error: "Database error, using default menu",
      })
    }
  } catch (error) {
    console.error("Error in enhanced-menu API route:", error)
    return NextResponse.json({
      items: defaultMenuItems,
      error: "Failed to fetch menu",
      isAuthenticated: false,
    })
  }
}

// Helper function to build menu hierarchy
function buildMenuHierarchy(items: MenuItemWithPermission[]): MenuItemWithPermission[] {
  // Create a map of parent items
  const itemMap = new Map<number, MenuItemWithPermission>()
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] })
  })

  // Build the hierarchy
  const rootItems: MenuItemWithPermission[] = []

  itemMap.forEach((item) => {
    if (item.parentId === null) {
      rootItems.push(item)
    } else {
      const parent = itemMap.get(item.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(item)
      } else {
        // If parent doesn't exist, treat as root item
        rootItems.push(item)
      }
    }
  })

  // If no items were found, return default menu
  if (rootItems.length === 0) {
    return defaultMenuItems
  }

  return rootItems
}
