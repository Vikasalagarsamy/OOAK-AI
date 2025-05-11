"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutDashboard,
  Building2,
  Users,
  ShoppingBag,
  Settings,
  Shield,
  FileText,
  BarChart3,
  Calendar,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useAuthStatus } from "@/hooks/use-auth-status"

// Define menu item type
type MenuItem = {
  name: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
  requiredRoles?: string[]
  description?: string
}

// Define menu categories
type MenuCategory = {
  id: string
  label: string
  items: MenuItem[]
}

// Define the menu data
const menuData: MenuCategory[] = [
  {
    id: "all",
    label: "All",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-6 w-6" />,
        description: "Overview of system metrics",
      },
      {
        name: "Organization",
        href: "/organization",
        icon: <Building2 className="h-6 w-6" />,
        description: "Manage companies and branches",
      },
      {
        name: "People",
        href: "/people",
        icon: <Users className="h-6 w-6" />,
        description: "Manage employees and departments",
      },
      {
        name: "Sales",
        href: "/sales",
        icon: <ShoppingBag className="h-6 w-6" />,
        description: "Track leads and sales activities",
      },
      {
        name: "Reports",
        href: "/reports",
        icon: <BarChart3 className="h-6 w-6" />,
        description: "View analytics and reports",
      },
      {
        name: "Events",
        href: "/events",
        icon: <Calendar className="h-6 w-6" />,
        description: "Manage company events",
        adminOnly: true,
      },
      {
        name: "Admin",
        href: "/admin",
        icon: <Shield className="h-6 w-6" />,
        description: "System administration",
        adminOnly: true,
      },
      {
        name: "Documents",
        href: "/documents",
        icon: <FileText className="h-6 w-6" />,
        description: "Manage company documents",
        requiredRoles: ["Administrator", "Manager"],
      },
      {
        name: "Projects",
        href: "/projects",
        icon: <Briefcase className="h-6 w-6" />,
        description: "Manage company projects",
        requiredRoles: ["Administrator", "Project Manager"],
      },
      {
        name: "Settings",
        href: "/settings",
        icon: <Settings className="h-6 w-6" />,
        description: "System configuration",
        adminOnly: true,
      },
    ],
  },
  {
    id: "organization",
    label: "Organization",
    items: [
      {
        name: "Companies",
        href: "/organization/companies",
        icon: <Building2 className="h-6 w-6" />,
        description: "Manage company profiles",
      },
      {
        name: "Branches",
        href: "/organization/branches",
        icon: <Building2 className="h-6 w-6" />,
        description: "Manage company branches",
      },
      {
        name: "Vendors",
        href: "/organization/vendors",
        icon: <Building2 className="h-6 w-6" />,
        description: "Manage vendor relationships",
      },
      {
        name: "Clients",
        href: "/organization/clients",
        icon: <Users className="h-6 w-6" />,
        description: "Manage client relationships",
      },
      {
        name: "User Accounts",
        href: "/organization/user-accounts",
        icon: <Users className="h-6 w-6" />,
        description: "Manage system users",
        adminOnly: true,
      },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      {
        name: "Employees",
        href: "/people/employees",
        icon: <Users className="h-6 w-6" />,
        description: "Manage employee records",
      },
      {
        name: "Departments",
        href: "/people/departments",
        icon: <Users className="h-6 w-6" />,
        description: "Manage departments",
      },
      {
        name: "Designations",
        href: "/people/designations",
        icon: <Users className="h-6 w-6" />,
        description: "Manage job titles",
      },
      {
        name: "Dashboard",
        href: "/people/dashboard",
        icon: <LayoutDashboard className="h-6 w-6" />,
        description: "People analytics",
      },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      {
        name: "Dashboard",
        href: "/sales",
        icon: <LayoutDashboard className="h-6 w-6" />,
        description: "Sales overview",
      },
      {
        name: "Create Lead",
        href: "/sales/create-lead",
        icon: <ShoppingBag className="h-6 w-6" />,
        description: "Add new sales leads",
      },
      {
        name: "My Leads",
        href: "/sales/my-leads",
        icon: <ShoppingBag className="h-6 w-6" />,
        description: "View your assigned leads",
      },
      {
        name: "Follow Up",
        href: "/sales/follow-up",
        icon: <ShoppingBag className="h-6 w-6" />,
        description: "Manage lead follow-ups",
      },
      {
        name: "Lead Sources",
        href: "/sales/lead-sources",
        icon: <ShoppingBag className="h-6 w-6" />,
        description: "Manage lead sources",
        requiredRoles: ["Administrator", "Sales Head"],
      },
    ],
  },
]

export function DashboardNav() {
  const [activeTab, setActiveTab] = useState("all")
  const { isAdmin, roleName, isLoading, error } = useAuthStatus()

  // Filter menu items based on user role
  const filterMenuItems = (items: MenuItem[]) => {
    // During loading or in preview mode, show all items
    if (isLoading || isAdmin) return items

    return items.filter((item) => {
      // If item is admin-only and user is not admin, hide it
      if (item.adminOnly && !isAdmin) return false

      // If item requires specific roles
      if (item.requiredRoles && roleName) {
        return item.requiredRoles.includes(roleName)
      }

      // By default, show the item
      return true
    })
  }

  // Get the current category's filtered items
  const currentItems = menuData.find((category) => category.id === activeTab)?.items || []
  const filteredItems = filterMenuItems(currentItems)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Quick Navigation</h2>
        {isAdmin && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Administrator Access
          </Badge>
        )}
        {isLoading && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">
            Loading permissions...
          </Badge>
        )}
        {error && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Using default permissions
          </Badge>
        )}
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {menuData.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredItems.map((item) => (
          <Link href={item.href} key={item.href}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
              <CardContent className="p-6 flex flex-col items-center justify-center space-y-2 text-center">
                <div className={`${item.adminOnly ? "text-red-500" : "text-primary"}`}>{item.icon}</div>
                <div className="space-y-1">
                  <h3 className="font-medium">{item.name}</h3>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </div>
                {item.adminOnly && (
                  <Badge variant="outline" className="mt-2 text-xs bg-red-50 text-red-700 border-red-200">
                    Admin Only
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
