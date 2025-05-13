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
} from "lucide-react"
import { SidebarRoleSwitcher } from "./sidebar-role-switcher"

type MenuItem = {
  title: string
  href?: string
  icon: React.ReactNode
  requiredRole?: string[] // Roles that can access this item
  adminOnly?: boolean // If true, only admins can see this
  submenu?: {
    title: string
    href: string
    icon: React.ReactNode
    requiredRole?: string[] // Roles that can access this subitem
    adminOnly?: boolean // If true, only admins can see this
  }[]
}

// Define all menu items in the application
const allMenuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Organization",
    icon: <Building2 className="h-5 w-5" />,
    submenu: [
      {
        title: "Companies",
        href: "/organization/companies",
        icon: <Building className="h-4 w-4" />,
      },
      {
        title: "Branches",
        href: "/organization/branches",
        icon: <GitBranch className="h-4 w-4" />,
      },
      {
        title: "Vendors",
        href: "/organization/vendors",
        icon: <Truck className="h-4 w-4" />,
      },
      {
        title: "Suppliers",
        href: "/organization/suppliers",
        icon: <Package className="h-4 w-4" />,
      },
      {
        title: "Clients",
        href: "/organization/clients",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Roles",
        href: "/organization/roles",
        icon: <Shield className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        title: "User Accounts",
        href: "/organization/user-accounts",
        icon: <UserCog className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        title: "Account Creation",
        href: "/organization/account-creation",
        icon: <UserPlus className="h-4 w-4" />,
        adminOnly: true,
      },
    ],
  },
  {
    title: "People",
    icon: <Users className="h-5 w-5" />,
    submenu: [
      {
        title: "Dashboard",
        href: "/people/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        title: "Employees",
        href: "/people/employees",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Departments",
        href: "/people/departments",
        icon: <Building className="h-4 w-4" />,
      },
      {
        title: "Designations",
        href: "/people/designations",
        icon: <Briefcase className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Sales",
    icon: <DollarSign className="h-5 w-5" />,
    submenu: [
      {
        title: "Dashboard",
        href: "/sales",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        title: "Create Lead",
        href: "/sales/create-lead",
        icon: <UserPlus className="h-4 w-4" />,
      },
      {
        title: "My Leads",
        href: "/sales/my-leads",
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        title: "Manage Lead",
        href: "/sales/manage-lead",
        icon: <Settings className="h-4 w-4" />,
      },
      {
        title: "Unassigned Lead",
        href: "/sales/unassigned-lead",
        icon: <Briefcase className="h-4 w-4" />,
      },
      {
        title: "Lead Sources",
        href: "/sales/lead-sources",
        icon: <Truck className="h-4 w-4" />,
      },
      {
        title: "Follow Up",
        href: "/sales/follow-up",
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        title: "Quotation",
        href: "/sales/quotation",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        title: "Order Confirmation",
        href: "/sales/order-confirmation",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      {
        title: "Rejected Leads",
        href: "/sales/rejected-leads",
        icon: <XCircle className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Reports",
    icon: <BarChart className="h-5 w-5" />,
    submenu: [
      {
        title: "Lead Sources",
        href: "/reports/lead-sources",
        icon: <PieChart className="h-4 w-4" />,
      },
      {
        title: "Sales Performance",
        href: "/reports/sales-performance",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        title: "Employee Performance",
        href: "/reports/employee-performance",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Conversion Funnel",
        href: "/reports/conversion-funnel",
        icon: <GitBranch className="h-4 w-4" />,
      },
      {
        title: "Team Performance",
        href: "/reports/team-performance",
        icon: <Users className="h-4 w-4" />,
      },
      {
        title: "Trend Analysis",
        href: "/reports/trends",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        title: "Custom Reports",
        href: "/reports/custom",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Event Coordination",
    icon: <Calendar className="h-5 w-5" />,
    submenu: [
      {
        title: "Events Dashboard",
        href: "/event-coordination/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        title: "Event Calendar",
        href: "/event-coordination/calendar",
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        title: "Events",
        href: "/events",
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        title: "Event Types",
        href: "/event-coordination/event-types",
        icon: <List className="h-4 w-4" />,
      },
      {
        title: "Venues",
        href: "/event-coordination/venues",
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        title: "Staff Assignment",
        href: "/event-coordination/staff-assignment",
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Audit",
    icon: <ClipboardList className="h-5 w-5" />,
    submenu: [
      {
        title: "Activity Logs",
        href: "/audit/activity-logs",
        icon: <List className="h-4 w-4" />,
      },
      {
        title: "Employee Audit",
        href: "/audit/employee",
        icon: <UserCheck className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "Admin",
    icon: <Settings className="h-5 w-5" />,
    adminOnly: true, // Only admins can see this menu
    submenu: [
      {
        title: "Menu & Role Permissions",
        href: "/admin/menu-permissions",
        icon: <Lock className="h-4 w-4" />,
        adminOnly: true,
      },
      // All other Admin menu items have been removed as requested
    ],
  },
]

// Create a custom hook to safely use role information
function useSafeRole() {
  // Try to get role information, but don't throw if it's not available
  let useRole
  try {
    // Dynamically import the useRole hook
    ;({ useRole } = require("@/contexts/role-context"))
  } catch (error) {
    // If the module or hook doesn't exist, return a default function
    console.warn("Role context module not available, using default role settings")
    useRole = () => ({
      currentRole: { id: "admin", name: "Administrator", isAdmin: true },
      isAdmin: true,
      filteredMenu: {},
      availableRoles: [],
      setCurrentRole: () => {},
    })
  }

  try {
    // Try to use the hook
    return useRole()
  } catch (error) {
    // If the hook throws (e.g., no provider), return default values
    console.warn("Role provider not available, using default role settings")
    return {
      currentRole: { id: "admin", name: "Administrator", isAdmin: true },
      isAdmin: true,
      filteredMenu: {},
      availableRoles: [],
      setCurrentRole: () => {},
    }
  }
}

export function SimpleSidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  // Use our safe role hook
  const { isAdmin, currentRole } = useSafeRole()
  const currentRoleId = currentRole?.id || "admin"

  // Filter menu items based on user role
  const filteredMenuItems = useMemo(() => {
    return allMenuItems.filter((item) => {
    console.log("item", item);
      // If the item is admin-only and user is not admin, hide it
      if (item.adminOnly && !isAdmin) {
        return false
      }

      // If the item has a required role and user doesn't have it, hide it
      if (item.requiredRole && !item.requiredRole.includes(currentRoleId)) {
        return false
      }

      // If the item has submenu items, filter those too
      if (item.submenu) {
        const filteredSubmenu = item.submenu.filter((subItem) => {
          if (subItem.adminOnly && !isAdmin) {
            return false
          }
          if (subItem.requiredRole && !subItem.requiredRole.includes(currentRoleId)) {
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
  }, [currentRoleId, isAdmin])

   console.log("filteredMenuItems", filteredMenuItems);

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

      {/* Role Switcher at the bottom of the sidebar - only show if role context is available */}
      <SidebarRoleSwitcher />
    </div>
  )
}
