"use client"

import type React from "react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
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
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  title: string
  href?: string
  icon: React.ReactNode
  submenu?: {
    title: string
    href: string
    icon: React.ReactNode
    description: string
  }[]
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: "Organization",
    icon: <Building2 className="h-4 w-4" />,
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
    ],
  },
  {
    title: "People",
    icon: <Users className="h-4 w-4" />,
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
    icon: <BarChart className="h-4 w-4" />,
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
        icon: <Briefcase className="h-4 w-4" />,
        description: "Create new sales lead",
      },
      {
        title: "My Leads",
        href: "/sales/my-leads",
        icon: <Briefcase className="h-4 w-4" />,
        description: "View and manage my leads",
      },
      {
        title: "Unassigned Leads",
        href: "/sales/unassigned-lead",
        icon: <Briefcase className="h-4 w-4" />,
        description: "Unassigned leads",
      },
      {
        title: "Lead Sources",
        href: "/sales/lead-sources",
        icon: <Briefcase className="h-4 w-4" />,
        description: "Manage lead sources",
      },
    ],
  },
  {
    title: "Reports",
    icon: <BarChart className="h-4 w-4" />,
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
]

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const pathname = usePathname()

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu(openSubmenu === title ? null : title)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px]">
        <div className="flex flex-col h-full">
          <div className="border-b p-4 flex items-center justify-between">
            <h2 className="font-semibold">ONE OF A KIND PORTAL</h2>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 overflow-auto">
            <ul className="p-2 space-y-1">
              {navigationItems.map((item) => (
                <li key={item.title}>
                  {item.submenu ? (
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-left"
                        onClick={() => toggleSubmenu(item.title)}
                      >
                        <span className="flex items-center">
                          {item.icon}
                          <span className="ml-2">{item.title}</span>
                        </span>
                        {openSubmenu === item.title ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      {openSubmenu === item.title && (
                        <ul className="pl-4 space-y-1">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.title}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "flex items-center p-2 rounded-md hover:bg-muted text-sm",
                                  pathname === subItem.href && "bg-muted font-medium",
                                )}
                                onClick={() => setOpen(false)}
                              >
                                {subItem.icon}
                                <span className="ml-2">{subItem.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className={cn(
                        "flex items-center p-2 rounded-md hover:bg-muted text-sm",
                        pathname === item.href && "bg-muted font-medium",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
