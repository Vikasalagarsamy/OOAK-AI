"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Menu, Building2, Users, Briefcase } from "lucide-react"

interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MobileNav({ className, ...props }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      active: pathname === "/",
    },
    {
      href: "/organization",
      label: "Organization",
      active: pathname === "/organization",
    },
    {
      href: "/organization/companies",
      label: "Companies",
      active: pathname === "/organization/companies",
    },
    {
      href: "/organization/branches",
      label: "Branches",
      active: pathname === "/organization/branches",
    },
    {
      href: "/organization/vendors",
      label: "Vendors",
      active: pathname === "/organization/vendors",
    },
    {
      href: "/organization/suppliers",
      label: "Suppliers",
      active: pathname === "/organization/suppliers",
    },
    {
      href: "/organization/clients",
      label: "Clients",
      active: pathname === "/organization/clients",
    },
    {
      href: "/organization/roles",
      label: "User Roles",
      active: pathname === "/organization/roles",
    },
    {
      href: "/organization/account-creation",
      label: "Account Creation",
      active: pathname === "/organization/account-creation",
    },
    {
      href: "/organization/user-accounts",
      label: "User Accounts",
      active: pathname === "/organization/user-accounts",
    },
    {
      href: "/people",
      label: "People",
      active: pathname === "/people",
    },
    {
      href: "/people/employees",
      label: "Employees",
      active: pathname === "/people/employees",
    },
    {
      href: "/people/departments",
      label: "Departments",
      active: pathname === "/people/departments",
    },
    {
      href: "/people/designations",
      label: "Designations",
      active: pathname === "/people/designations",
    },
    {
      href: "/sales",
      label: "Sales",
      active: pathname === "/sales",
    },
    {
      href: "/sales/my-leads",
      label: "My Leads",
      active: pathname === "/sales/my-leads",
    },
    {
      href: "/sales/create-lead",
      label: "Create Lead",
      active: pathname === "/sales/create-lead",
    },
    {
      href: "/sales/manage-lead",
      label: "Manage Leads",
      active: pathname === "/sales/manage-lead",
    },
    {
      href: "/sales/unassigned-lead",
      label: "Unassigned Lead",
      active: pathname === "/sales/unassigned-lead",
    },
    {
      href: "/sales/lead-sources",
      label: "Lead Sources",
      active: pathname === "/sales/lead-sources",
    },
  ]

  return (
    <div className={cn("md:hidden", className)} {...props}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
            <div className="flex flex-col space-y-3">
              {routes.map((route) => {
                if (route.label === "People") {
                  return (
                    <div key={route.href}>
                      <Link
                        href={route.href}
                        className={cn(
                          "text-sm transition-colors hover:text-primary",
                          route.active ? "text-black dark:text-white font-semibold" : "text-muted-foreground",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {route.label}
                      </Link>
                      <div className="px-4 py-2">
                        <h4 className="text-sm font-medium mb-2 px-3">People</h4>
                        <div className="flex flex-col gap-1 pl-2">
                          <Link
                            href="/people/employees"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/people/employees"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Employees
                          </Link>
                          <Link
                            href="/people/departments"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/people/departments"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            <Building2 className="mr-2 h-4 w-4" />
                            Departments
                          </Link>
                          <Link
                            href="/people/designations"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/people/designations"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            <Briefcase className="mr-2 h-4 w-4" />
                            Designations
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (route.label === "Sales") {
                  return (
                    <div key={route.href}>
                      <Link
                        href={route.href}
                        className={cn(
                          "text-sm transition-colors hover:text-primary",
                          route.active ? "text-black dark:text-white font-semibold" : "text-muted-foreground",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {route.label}
                      </Link>
                      <div className="px-4 py-2">
                        <h4 className="text-sm font-medium mb-2 px-3">Sales</h4>
                        <div className="flex flex-col gap-1 pl-2">
                          <Link
                            href="/sales/my-leads"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/sales/my-leads"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            My Leads
                          </Link>
                          <Link
                            href="/sales/create-lead"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/sales/create-lead"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Create Lead
                          </Link>
                          <Link
                            href="/sales/manage-lead"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/sales/manage-lead"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Manage Leads
                          </Link>
                          <Link
                            href="/sales/unassigned-lead"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/sales/unassigned-lead"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Unassigned Leads
                          </Link>
                          <Link
                            href="/sales/lead-sources"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/sales/lead-sources"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Lead Sources
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (route.label === "Organization") {
                  return (
                    <div key={route.href}>
                      <Link
                        href={route.href}
                        className={cn(
                          "text-sm transition-colors hover:text-primary",
                          route.active ? "text-black dark:text-white font-semibold" : "text-muted-foreground",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        {route.label}
                      </Link>
                      <div className="px-4 py-2">
                        <h4 className="text-sm font-medium mb-2 px-3">Organization</h4>
                        <div className="flex flex-col gap-1 pl-2">
                          <Link
                            href="/organization/companies"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/organization/companies"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Companies
                          </Link>
                          <Link
                            href="/organization/branches"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/organization/branches"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Branches
                          </Link>
                          <Link
                            href="/organization/roles"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/organization/roles"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Roles
                          </Link>
                          <Link
                            href="/organization/account-creation"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/organization/account-creation"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Account Creation
                          </Link>
                          <Link
                            href="/organization/user-accounts"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/organization/user-accounts"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            User Accounts
                          </Link>
                          <Link
                            href="/organization/vendors"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/organization/vendors"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Vendors
                          </Link>
                          <Link
                            href="/organization/suppliers"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/organization/suppliers"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Suppliers
                          </Link>
                          <Link
                            href="/organization/clients"
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md",
                              pathname === "/organization/clients"
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            Clients
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "text-sm transition-colors hover:text-primary",
                      route.active ? "text-black dark:text-white font-semibold" : "text-muted-foreground",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {route.label}
                  </Link>
                )
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
