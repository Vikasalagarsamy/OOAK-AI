"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <NavigationMenu className={className} {...props}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>Dashboard</NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Organization</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="col-span-full">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/organization"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">Organization</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Manage your organization structure, companies, branches, and more.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <Link href="/organization/companies" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/organization/companies" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Companies</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Manage your companies</p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/organization/branches" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/organization/branches" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Branches</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Manage your branches</p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/organization/roles" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/organization/roles" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Roles</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Manage user roles and permissions
                    </p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/organization/vendors" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/organization/vendors" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Vendors</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Manage your vendors</p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/organization/suppliers" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/organization/suppliers" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Suppliers</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Manage your suppliers</p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/organization/clients" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/organization/clients" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Clients</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Manage your clients</p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/organization/account-creation" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/organization/account-creation" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Account Creation</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Create user accounts for employees
                    </p>
                  </NavigationMenuLink>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>People</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="col-span-full">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/people"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">People</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Manage your employees, departments, and designations.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <Link href="/people/employees" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/people/employees" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Employees</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Manage your employees</p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/people/departments" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/people/departments" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Departments</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Manage your departments</p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/people/designations" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/people/designations" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Designations</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Manage your designations</p>
                  </NavigationMenuLink>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Sales</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="col-span-full">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    href="/sales"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">Sales</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Manage your sales leads, follow-ups, quotations, and more.
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <li>
                <Link href="/sales/my-leads" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/sales/my-leads" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">My Leads</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      View leads assigned to you
                    </p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/sales/create-lead" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/sales/create-lead" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Create Lead</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">Create a new sales lead</p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/sales/manage-lead" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/sales/manage-lead" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Manage Leads</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      View and manage your leads
                    </p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/sales/unassigned-lead" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/sales/unassigned-lead" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Unassigned Leads</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      View and assign unassigned leads
                    </p>
                  </NavigationMenuLink>
                </Link>
              </li>
              <li>
                <Link href="/sales/lead-sources" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                      pathname === "/sales/lead-sources" && "bg-accent text-accent-foreground",
                    )}
                  >
                    <div className="text-sm font-medium leading-none">Lead Sources</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Manage lead acquisition sources
                    </p>
                  </NavigationMenuLink>
                </Link>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
