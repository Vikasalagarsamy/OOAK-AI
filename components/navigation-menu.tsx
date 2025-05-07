"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  NavigationMenu as Nav,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import {
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

export function NavigationMenu() {
  const pathname = usePathname()

  return (
    <Nav className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Building2 className="mr-2 h-4 w-4" /> Organization
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <ListItem href="/organization/companies" title="Companies" icon={<Building className="h-4 w-4" />}>
                Manage organization companies
              </ListItem>
              <ListItem href="/organization/branches" title="Branches" icon={<Building2 className="h-4 w-4" />}>
                Manage branch locations
              </ListItem>
              <ListItem href="/organization/clients" title="Clients" icon={<Briefcase className="h-4 w-4" />}>
                Client management
              </ListItem>
              <ListItem href="/organization/suppliers" title="Suppliers" icon={<Briefcase className="h-4 w-4" />}>
                Supplier management
              </ListItem>
              <ListItem href="/organization/vendors" title="Vendors" icon={<Briefcase className="h-4 w-4" />}>
                Vendor management
              </ListItem>
              <ListItem href="/organization/roles" title="Roles" icon={<UserCog className="h-4 w-4" />}>
                User roles and permissions
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Users className="mr-2 h-4 w-4" /> People
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <ListItem href="/people/dashboard" title="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
                People analytics dashboard
              </ListItem>
              <ListItem href="/people/employees" title="Employees" icon={<Users className="h-4 w-4" />}>
                Manage employees
              </ListItem>
              <ListItem href="/people/departments" title="Departments" icon={<Building className="h-4 w-4" />}>
                Manage departments
              </ListItem>
              <ListItem href="/people/designations" title="Designations" icon={<UserCog className="h-4 w-4" />}>
                Manage designations
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <BarChart className="mr-2 h-4 w-4" /> Sales
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <ListItem href="/sales" title="Dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
                Sales dashboard
              </ListItem>
              <ListItem href="/sales/create-lead" title="Create Lead" icon={<Briefcase className="h-4 w-4" />}>
                Create new sales lead
              </ListItem>
              <ListItem href="/sales/my-leads" title="My Leads" icon={<Briefcase className="h-4 w-4" />}>
                View and manage my leads
              </ListItem>
              <ListItem href="/sales/unassigned-lead" title="Unassigned Leads" icon={<Briefcase className="h-4 w-4" />}>
                Unassigned leads
              </ListItem>
              <ListItem href="/sales/lead-sources" title="Lead Sources" icon={<Briefcase className="h-4 w-4" />}>
                Manage lead sources
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <BarChart className="mr-2 h-4 w-4" /> Reports
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <ListItem
                href="/reports/lead-sources"
                title="Lead Source Analysis"
                icon={<PieChart className="h-4 w-4" />}
              >
                Analyze performance of different lead sources
              </ListItem>
              <ListItem
                href="/reports/conversion-funnel"
                title="Conversion Funnel"
                icon={<GitBranch className="h-4 w-4" />}
              >
                Track lead progression through sales stages
              </ListItem>
              <ListItem href="/reports/team-performance" title="Team Performance" icon={<Users className="h-4 w-4" />}>
                Compare sales team performance metrics
              </ListItem>
              <ListItem href="/reports/trends" title="Trend Analysis" icon={<TrendingUp className="h-4 w-4" />}>
                Analyze lead and conversion trends over time
              </ListItem>
              <ListItem href="/reports/custom" title="Custom Reports" icon={<Settings className="h-4 w-4" />}>
                Create and save custom report configurations
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </Nav>
  )
}

interface ListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  title: string
  icon?: React.ReactNode
}

const ListItem = React.forwardRef<React.ElementRef<"a">, ListItemProps>(
  ({ className, title, children, icon, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className,
            )}
            {...props}
          >
            <div className="flex items-center gap-2 text-sm font-medium leading-none">
              {icon}
              <span>{title}</span>
            </div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = "ListItem"
