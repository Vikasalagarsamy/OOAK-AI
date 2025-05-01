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
      href: "/sales/create-lead",
      label: "Create Lead",
      active: pathname === "/sales/create-lead",
    },
    {
      href: "/sales/manage-lead",
      label: "Manage Lead",
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
