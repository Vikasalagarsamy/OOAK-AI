"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Building2,
  Users,
  BarChart,
  Briefcase,
  Building,
  DollarSign,
  Calendar,
  Settings,
  UserCog,
  Package,
  Truck,
  Shield,
  UserPlus,
  PieChart,
  GitBranch,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  List,
  MapPin,
  ClipboardList,
  UserCheck,
  Lock,
  Eye,
  Edit,
  Trash,
} from "lucide-react"
import { SidebarRoleSwitcher } from "./sidebar-role-switcher"
import type { Permission } from "@/types/role"
import { useRole } from "@/contexts/role-context" // Import the hook directly

// Enhanced permission types for more granular control
type PermissionType = "view" | "read" | "write" | "delete" | "admin"

// Define permission sets for different user types
type PermissionSet = {
  requiredPermissions: PermissionType[]
  requiredRoles?: string[]
  anyPermission?: boolean // If true, user needs ANY of the permissions, not ALL
}

type MenuItem = {
  title: string
  href?: string
  icon: React.ReactNode
  permissions?: PermissionSet
  adminOnly?: boolean // Legacy support
  submenu?: {
    title: string
    href: string
    icon: React.ReactNode
    permissions?: PermissionSet
    adminOnly?: boolean // Legacy support
    inheritPermissions?: boolean // If true, inherits permissions from parent
  }[]
}

// Define all menu items in the application with enhanced permissions
const allMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    permissions: {
      requiredPermissions: ["view"],
      anyPermission: true,
    },
  },
  {
    title: "Organization",
    icon: <Building2 className="h-5 w-5" />,
    permissions: {
      requiredPermissions: ["view", "read"],
      anyPermission: true,
    },
    submenu: [
      {
        title: "Companies",
        href: "/organization/companies",
        icon: <Building className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
        },
      },
      {
        title: "Branches",
        href: "/organization/branches",
        icon: <GitBranch className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
        },
      },
      {
        title: "Vendors",
        href: "/organization/vendors",
        icon: <Truck className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
        },
      },
      {
        title: "Suppliers",
        href: "/organization/suppliers",
        icon: <Package className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
        },
      },
      {
        title: "Clients",
        href: "/organization/clients",
        icon: <Users className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
        },
      },
      {
        title: "Roles",
        href: "/organization/roles",
        icon: <Shield className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["admin"],
          requiredRoles: ["admin", "system_admin"],
        },
      },
      {
        title: "User Accounts",
        href: "/organization/user-accounts",
        icon: <UserCog className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["admin"],
          requiredRoles: ["admin", "system_admin"],
        },
      },
      {
        title: "Account Creation",
        href: "/organization/account-creation",
        icon: <UserPlus className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["admin"],
          requiredRoles: ["admin", "system_admin"],
        },
      },
    ],
  },
  {
    title: "People",
    icon: <Users className="h-5 w-5" />,
    permissions: {
      requiredPermissions: ["view", "read"],
      anyPermission: true,
    },
    submenu: [
      {
        title: "Dashboard",
        href: "/people/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Employees",
        href: "/people/employees",
        icon: <Users className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
        },
      },
      {
        title: "Departments",
        href: "/people/departments",
        icon: <Building className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
        },
      },
      {
        title: "Designations",
        href: "/people/designations",
        icon: <Briefcase className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
        },
      },
    ],
  },
  {
    title: "Sales",
    icon: <DollarSign className="h-5 w-5" />,
    permissions: {
      requiredPermissions: ["view", "read"],
      anyPermission: true,
      requiredRoles: ["admin", "sales_manager", "sales_rep"],
    },
    submenu: [
      {
        title: "Dashboard",
        href: "/sales",
        icon: <LayoutDashboard className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Create Lead",
        href: "/sales/create-lead",
        icon: <UserPlus className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["write"],
          requiredRoles: ["admin", "sales_manager", "sales_rep"],
        },
      },
      {
        title: "My Leads",
        href: "/sales/my-leads",
        icon: <Briefcase className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["view", "read"],
          anyPermission: true,
          requiredRoles: ["admin", "sales_manager", "sales_rep"],
        },
      },
      {
        title: "Manage Lead",
        href: "/sales/manage-lead",
        icon: <Settings className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["write"],
          requiredRoles: ["admin", "sales_manager"],
        },
      },
      {
        title: "Unassigned Lead",
        href: "/sales/unassigned-lead",
        icon: <Briefcase className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "write"],
          requiredRoles: ["admin", "sales_manager"],
        },
      },
      {
        title: "Lead Sources",
        href: "/sales/lead-sources",
        icon: <Truck className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read"],
          requiredRoles: ["admin", "sales_manager", "sales_rep"],
        },
      },
      {
        title: "Follow Up",
        href: "/sales/follow-up",
        icon: <Calendar className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "write"],
          anyPermission: true,
          requiredRoles: ["admin", "sales_manager", "sales_rep"],
        },
      },
      {
        title: "Quotation",
        href: "/sales/quotation",
        icon: <FileText className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "write"],
          anyPermission: true,
          requiredRoles: ["admin", "sales_manager", "sales_rep"],
        },
      },
      {
        title: "Order Confirmation",
        href: "/sales/order-confirmation",
        icon: <CheckCircle className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "write"],
          requiredRoles: ["admin", "sales_manager"],
        },
      },
      {
        title: "Rejected Leads",
        href: "/sales/rejected-leads",
        icon: <XCircle className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read"],
          requiredRoles: ["admin", "sales_manager"],
        },
      },
    ],
  },
  {
    title: "Reports",
    icon: <BarChart className="h-5 w-5" />,
    permissions: {
      requiredPermissions: ["read"],
      requiredRoles: ["admin", "sales_manager", "reports_viewer"],
    },
    submenu: [
      {
        title: "Lead Sources",
        href: "/reports/lead-sources",
        icon: <PieChart className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Sales Performance",
        href: "/reports/sales-performance",
        icon: <TrendingUp className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read"],
          requiredRoles: ["admin", "sales_manager"],
        },
      },
      {
        title: "Employee Performance",
        href: "/reports/employee-performance",
        icon: <Users className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read"],
          requiredRoles: ["admin", "hr_manager", "sales_manager"],
        },
      },
      {
        title: "Conversion Funnel",
        href: "/reports/conversion-funnel",
        icon: <GitBranch className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Team Performance",
        href: "/reports/team-performance",
        icon: <Users className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read"],
          requiredRoles: ["admin", "sales_manager"],
        },
      },
      {
        title: "Trend Analysis",
        href: "/reports/trends",
        icon: <TrendingUp className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Custom Reports",
        href: "/reports/custom",
        icon: <Settings className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "write"],
          requiredRoles: ["admin", "sales_manager"],
        },
      },
    ],
  },
  {
    title: "Event Coordination",
    icon: <Calendar className="h-5 w-5" />,
    permissions: {
      requiredPermissions: ["view", "read"],
      anyPermission: true,
      requiredRoles: ["admin", "event_coordinator", "event_manager"],
    },
    submenu: [
      {
        title: "Events Dashboard",
        href: "/event-coordination/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Event Calendar",
        href: "/event-coordination/calendar",
        icon: <Calendar className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Events",
        href: "/events",
        icon: <Calendar className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Event Types",
        href: "/event-coordination/event-types",
        icon: <List className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "write"],
          requiredRoles: ["admin", "event_manager"],
        },
      },
      {
        title: "Venues",
        href: "/event-coordination/venues",
        icon: <MapPin className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "write"],
          anyPermission: true,
          requiredRoles: ["admin", "event_coordinator", "event_manager"],
        },
      },
      {
        title: "Staff Assignment",
        href: "/event-coordination/staff-assignment",
        icon: <Users className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "write"],
          requiredRoles: ["admin", "event_manager"],
        },
      },
    ],
  },
  {
    title: "Audit",
    icon: <ClipboardList className="h-5 w-5" />,
    permissions: {
      requiredPermissions: ["read", "admin"],
      anyPermission: true,
      requiredRoles: ["admin", "system_admin", "compliance_officer"],
    },
    submenu: [
      {
        title: "Activity Logs",
        href: "/audit/activity-logs",
        icon: <List className="h-4 w-4" />,
        inheritPermissions: true,
      },
      {
        title: "Employee Audit",
        href: "/audit/employee",
        icon: <UserCheck className="h-4 w-4" />,
        permissions: {
          requiredPermissions: ["read", "admin"],
          anyPermission: true,
          requiredRoles: ["admin", "system_admin", "hr_manager"],
        },
      },
    ],
  },
  {
    title: "Admin",
    icon: <Settings className="h-5 w-5" />,
    permissions: {
      requiredPermissions: ["admin"],
      requiredRoles: ["admin", "system_admin"],
    },
    submenu: [
      {
        title: "Menu & Role Permissions",
        href: "/admin/menu-permissions",
        icon: <Lock className="h-4 w-4" />,
        inheritPermissions: true,
      },
      // All other Admin menu items have been removed as requested
    ],
  },
]

// Helper function to check if a user has the required permissions
function hasRequiredPermissions(
  userPermissions: Record<string, Permission>,
  requiredPermissionSet: PermissionSet,
  isAdmin: boolean,
  userRoleId: string,
): boolean {
  // Admin override - admins can access everything
  if (isAdmin) return true

  // Check role-specific permissions
  if (requiredPermissionSet.requiredRoles && !requiredPermissionSet.requiredRoles.includes(userRoleId)) {
    return false
  }

  // If no specific permissions are required, allow access
  if (!requiredPermissionSet.requiredPermissions || requiredPermissionSet.requiredPermissions.length === 0) {
    return true
  }

  // For "admin" permission, only admins can access (already checked above)
  if (requiredPermissionSet.requiredPermissions.includes("admin") && !isAdmin) {
    return false
  }

  // Check if user has ANY of the required permissions (when anyPermission is true)
  if (requiredPermissionSet.anyPermission) {
    return requiredPermissionSet.requiredPermissions.some((permission) => {
      if (permission === "admin") return isAdmin

      // Check if user has this permission for any module
      return Object.values(userPermissions).some(
        (modulePermission) =>
          (permission === "view" && modulePermission.view) ||
          (permission === "read" && modulePermission.read) ||
          (permission === "write" && modulePermission.write) ||
          (permission === "delete" && modulePermission.delete),
      )
    })
  }

  // Check if user has ALL of the required permissions
  return requiredPermissionSet.requiredPermissions.every((permission) => {
    if (permission === "admin") return isAdmin

    // Check if user has this permission for any module
    return Object.values(userPermissions).some(
      (modulePermission) =>
        (permission === "view" && modulePermission.view) ||
        (permission === "read" && modulePermission.read) ||
        (permission === "write" && modulePermission.write) ||
        (permission === "delete" && modulePermission.delete),
    )
  })
}

export function SimpleSidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  // Use our safe role hook
  const { isAdmin, currentRole } = useRole()
  const currentRoleId = currentRole?.id || "admin"

  // Get user permissions from the role
  const userPermissions = currentRole?.permissions || {}

  // Filter menu items based on user role and permissions
  const filteredMenuItems = useMemo(() => {
    return allMenuItems.filter((item) => {
      // Legacy support for adminOnly
      if (item.adminOnly && !isAdmin) {
        return false
      }

      // Check permissions
      if (item.permissions && !hasRequiredPermissions(userPermissions, item.permissions, isAdmin, currentRoleId)) {
        return false
      }

      // If the item has submenu items, filter those too
      if (item.submenu) {
        const filteredSubmenu = item.submenu.filter((subItem) => {
          // Legacy support for adminOnly
          if (subItem.adminOnly && !isAdmin) {
            return false
          }

          // Handle permission inheritance
          if (subItem.inheritPermissions && item.permissions) {
            return hasRequiredPermissions(userPermissions, item.permissions, isAdmin, currentRoleId)
          }

          // Check specific permissions
          if (
            subItem.permissions &&
            !hasRequiredPermissions(userPermissions, subItem.permissions, isAdmin, currentRoleId)
          ) {
            return false
          }

          return true
        })

        // If all submenu items are filtered out, hide the parent menu
        if (filteredSubmenu.length === 0) {
          return false
        }

        // Update the submenu with filtered items
        item.submenu = filteredSubmenu
      }

      return true
    })
  }, [currentRoleId, isAdmin, userPermissions])

  // Auto-expand the menu that contains the current path
  useEffect(() => {
    const currentMenu = filteredMenuItems.find((item) =>
      item.submenu?.some((subItem) => pathname.startsWith(subItem.href)),
    )

    if (currentMenu) {
      setOpenMenus((prev) => ({
        ...prev,
        [currentMenu.title]: true,
      }))
    }
  }, [pathname, filteredMenuItems])

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 py-4 overflow-auto">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
          <div className="space-y-1">
            {filteredMenuItems.map((item) => (
              <div key={item.title} className="mb-1">
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                        openMenus[item.title] && "bg-muted/50",
                      )}
                    >
                      <span className="flex items-center">
                        {item.icon}
                        <span className="ml-2">{item.title}</span>
                      </span>
                      {openMenus[item.title] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {openMenus[item.title] && (
                      <div className="mt-1 space-y-1 pl-8">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "block rounded-md px-3 py-2 text-sm hover:bg-muted",
                              pathname === subItem.href && "bg-muted font-medium text-primary",
                            )}
                          >
                            <span className="flex items-center">
                              {subItem.icon}
                              <span className="ml-2">{subItem.title}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href || "#"}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                      pathname === item.href && "bg-muted text-primary",
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Permission Legend */}
      <div className="px-4 py-2 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Permission Legend:</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            <span>View</span>
          </div>
          <div className="flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            <span>Read</span>
          </div>
          <div className="flex items-center">
            <Edit className="h-3 w-3 mr-1" />
            <span>Write</span>
          </div>
          <div className="flex items-center">
            <Trash className="h-3 w-3 mr-1" />
            <span>Delete</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-3 w-3 mr-1" />
            <span>Admin</span>
          </div>
        </div>
      </div>

      {/* Role Switcher at the bottom of the sidebar */}
      <SidebarRoleSwitcher />
    </div>
  )
}
