"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Menu,
  Building2,
  GitBranch,
  Home,
  Users,
  ShoppingBag,
  Truck,
  UserRound,
  DollarSign,
  UserPlus,
  ClipboardList,
  PhoneCall,
  FileText,
  CheckSquare,
  XSquare,
} from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
            <span className="font-bold text-lg">Company & Branch Manager</span>
          </Link>
        </div>
        <div className="flex flex-col gap-3 mt-8">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center px-7 py-2 text-sm",
              pathname === "/" ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
            )}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
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
                <Building2 className="mr-2 h-4 w-4" />
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
                <GitBranch className="mr-2 h-4 w-4" />
                Branches
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
                <UserRound className="mr-2 h-4 w-4" />
                Clients
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
                <Users className="mr-2 h-4 w-4" />
                User Roles
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
                <ShoppingBag className="mr-2 h-4 w-4" />
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
                <Truck className="mr-2 h-4 w-4" />
                Suppliers
              </Link>
            </div>
          </div>

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
                <Users className="mr-2 h-4 w-4" />
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
                <Users className="mr-2 h-4 w-4" />
                Designations
              </Link>
            </div>
          </div>

          <div className="px-4 py-2">
            <h4 className="text-sm font-medium mb-2 px-3">Sales</h4>
            <div className="flex flex-col gap-1 pl-2">
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
                <UserPlus className="mr-2 h-4 w-4" />
                Create Lead
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
                <ClipboardList className="mr-2 h-4 w-4" />
                Unassigned Lead
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
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Lead
              </Link>
              <Link
                href="/sales/follow-up"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md",
                  pathname === "/sales/follow-up"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <PhoneCall className="mr-2 h-4 w-4" />
                Follow Up
              </Link>
              <Link
                href="/sales/quotation"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md",
                  pathname === "/sales/quotation"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <FileText className="mr-2 h-4 w-4" />
                Quotation
              </Link>
              <Link
                href="/sales/order-confirmation"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md",
                  pathname === "/sales/order-confirmation"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Order Confirmation
              </Link>
              <Link
                href="/sales/rejected-leads"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md",
                  pathname === "/sales/rejected-leads"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                <XSquare className="mr-2 h-4 w-4" />
                Rejected Leads
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
