"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Building2,
  Users,
  BarChart,
  UserCog,
  Briefcase,
  Building,
  PieChart,
  GitBranch,
  TrendingUp,
  Settings,
  Calendar,
  MapPin,
  ClipboardList,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  Activity,
  FileSearch,
  Shield,
} from "lucide-react"

type MenuItem = {
  title: string
  href?: string
  icon: React.ReactNode
  submenu?: {
    title: string
    href: string
    icon: React.ReactNode
    description?: string
  }[]
}

const menuItems: MenuItem[] = [
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
        description: "Manage organization companies",
      },
      {
        title: "Branches",
        href: "/organization/branches",
        icon: <Building2 className="h-4 w-4" />,
        description: "Manage branch locations",
      },
      {
        title: "Clients",
        href: "/organization/clients",
        icon: <Briefcase className="h-4 w-4" />,
        description: "Client management",
      },
      {
        title: "Suppliers",
        href: "/organization/suppliers",
        icon: <Briefcase className="h-4 w-4" />,
        description: "Supplier management",
      },
      {
        title: "Vendors",
        href: "/organization/vendors",
        icon: <Briefcase className="h-4 w-4" />,
        description: "Vendor management",
      },
      {
        title: "Roles",
        href: "/organization/roles",
        icon: <UserCog className="h-4 w-4" />,
        description: "User roles and permissions",
      },
      {
        title: "User Accounts",
        href: "/organization/user-accounts",
        icon: <Users className="h-4 w-4" />,
        description: "Manage user accounts",
      },
      {
        title: "Account Creation",
        href: "/organization/account-creation",
        icon: <UserCog className="h-4 w-4" />,
        description: "Create user accounts for employees",
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
        description: "People analytics dashboard",
      },
      {
        title: "Employees",
        href: "/people/employees",
        icon: <Users className="h-4 w-4" />,
        description: "Manage employees",
      },
      {
        title: "Departments",
        href: "/people/departments",
        icon: <Building className="h-4 w-4" />,
        description: "Manage departments",
      },
      {
        title: "Designations",
        href: "/people/designations",
        icon: <UserCog className="h-4 w-4" />,
        description: "Manage designations",
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
        description: "Sales dashboard",
      },
      {
        title: "Create Lead",
        href: "/sales/create-lead",
        icon: <FileText className="h-4 w-4" />,
        description: "Create new sales lead",
      },
      {
        title: "My Leads",
        href: "/sales/my-leads",
        icon: <ClipboardList className="h-4 w-4" />,
        description: "View and manage my leads",
      },
      {
        title: "Unassigned Leads",
        href: "/sales/unassigned-lead",
        icon: <AlertCircle className="h-4 w-4" />,
        description: "Unassigned leads",
      },
      {
        title: "Lead Sources",
        href: "/sales/lead-sources",
        icon: <GitBranch className="h-4 w-4" />,
        description: "Manage lead sources",
      },
      {
        title: "Follow Up",
        href: "/sales/follow-up",
        icon: <Clock className="h-4 w-4" />,
        description: "Follow up on leads",
      },
      {
        title: "Quotation",
        href: "/sales/quotation",
        icon: <FileText className="h-4 w-4" />,
        description: "Manage quotations",
      },
      {
        title: "Order Confirmation",
        href: "/sales/order-confirmation",
        icon: <FileText className="h-4 w-4" />,
        description: "Manage order confirmations",
      },
      {
        title: "Rejected Leads",
        href: "/sales/rejected-leads",
        icon: <AlertCircle className="h-4 w-4" />,
        description: "View and manage rejected leads",
      },
    ],
  },
  {
    title: "Reports",
    icon: <BarChart className="h-5 w-5" />,
    submenu: [
      {
        title: "Lead Source Analysis",
        href: "/reports/lead-sources",
        icon: <PieChart className="h-4 w-4" />,
        description: "Analyze performance of different lead sources",
      },
      {
        title: "Conversion Funnel",
        href: "/reports/conversion-funnel",
        icon: <GitBranch className="h-4 w-4" />,
        description: "Track lead progression through sales stages",
      },
      {
        title: "Team Performance",
        href: "/reports/team-performance",
        icon: <Users className="h-4 w-4" />,
        description: "Compare sales team performance metrics",
      },
      {
        title: "Trend Analysis",
        href: "/reports/trends",
        icon: <TrendingUp className="h-4 w-4" />,
        description: "Analyze lead and conversion trends over time",
      },
      {
        title: "Custom Reports",
        href: "/reports/custom",
        icon: <Settings className="h-4 w-4" />,
        description: "Create and save custom report configurations",
      },
    ],
  },
  {
    title: "Event Coordination",
    icon: <Calendar className="h-5 w-5" />,
    submenu: [
      {
        title: "Events Dashboard",
        href: "/events/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        description: "Overview of events",
      },
      {
        title: "Event Calendar",
        href: "/events/calendar",
        icon: <Calendar className="h-4 w-4" />,
        description: "Calendar view of events",
      },
      {
        title: "Events",
        href: "/events",
        icon: <Calendar className="h-4 w-4" />,
        description: "Manage events",
      },
      {
        title: "Event Types",
        href: "/events/types",
        icon: <ClipboardList className="h-4 w-4" />,
        description: "Manage event types",
      },
      {
        title: "Venues",
        href: "/events/venues",
        icon: <MapPin className="h-4 w-4" />,
        description: "Manage venues",
      },
      {
        title: "Staff Assignment",
        href: "/events/staff-assignment",
        icon: <Users className="h-4 w-4" />,
        description: "Assign staff to events",
      },
    ],
  },
  {
    title: "Audit",
    icon: <FileSearch className="h-5 w-5" />,
    submenu: [
      {
        title: "Activity Logs",
        href: "/audit",
        icon: <Activity className="h-4 w-4" />,
        description: "View system activity logs",
      },
      {
        title: "Employee Audit",
        href: "/audit/employee",
        icon: <FileSearch className="h-4 w-4" />,
        description: "Audit employee activities",
      },
    ],
  },
  {
    title: "Admin",
    icon: <Shield className="h-5 w-5" />,
    submenu: [
      {
        title: "Menu & Role Permissions",
        href: "/admin/menu-permissions",
        icon: <Settings className="h-4 w-4" />,
        description: "Manage menu access and role permissions",
      },
      {
        title: "System Settings",
        href: "/admin/settings",
        icon: <Settings className="h-4 w-4" />,
        description: "Configure system settings",
      },
      {
        title: "Bug Management",
        href: "/admin/bugs",
        icon: <AlertCircle className="h-4 w-4" />,
      },
    ],
  },
]

export function SidebarNavigation() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  // Check if the current path is within the organization section
  const isOrganizationSection = pathname.startsWith("/organization")

  // Function to toggle menu open/closed state
  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  // Auto-expand menus based on current path
  useEffect(() => {
    const updatedOpenMenus = { ...openMenus }

    menuItems.forEach((item) => {
      if (item.submenu) {
        // Check if any submenu item matches the current path
        const isActive = item.submenu.some(
          (subItem) => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`),
        )

        if (isActive) {
          updatedOpenMenus[item.title] = true
        }
      }
    })

    // Always expand Organization menu when in organization section
    if (isOrganizationSection) {
      updatedOpenMenus["Organization"] = true
    }

    // Always expand People menu when in people section
    const isPeopleSection = pathname.startsWith("/people")
    if (isPeopleSection) {
      updatedOpenMenus["People"] = true
    }

    setOpenMenus(updatedOpenMenus)
  }, [pathname])

  return (
    <div className="h-screen w-64 bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">ONE OF A KIND PORTAL</h2>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {menuItems.map((item) => (
            <div key={item.title} className="mb-1">
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md text-sm font-medium hover:bg-muted",
                      (openMenus[item.title] ||
                        (item.title === "Organization" && isOrganizationSection) ||
                        (item.title === "People" && pathname.startsWith("/people"))) &&
                        "bg-muted/50",
                    )}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                    </span>
                    {openMenus[item.title] ||
                    (item.title === "Organization" && isOrganizationSection) ||
                    (item.title === "People" && pathname.startsWith("/people")) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {(openMenus[item.title] ||
                    (item.title === "Organization" && isOrganizationSection) ||
                    (item.title === "People" && pathname.startsWith("/people"))) && (
                    <div className="ml-4 mt-1 space-y-1 pl-2 border-l">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center p-2 rounded-md text-sm hover:bg-muted",
                            (pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)) &&
                              "bg-muted font-medium text-primary",
                          )}
                        >
                          {subItem.icon}
                          <span className="ml-2">{subItem.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href || "#"}
                  className={cn(
                    "flex items-center p-2 rounded-md text-sm font-medium hover:bg-muted",
                    pathname === item.href && "bg-muted text-primary",
                  )}
                >
                  {item.icon}
                  <span className="ml-2">{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
