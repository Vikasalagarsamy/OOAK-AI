"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, Building2, Briefcase } from "lucide-react"
import { usePermissions } from "@/components/ultra-fast-auth-provider"

export function PeopleSubmenu() {
  const pathname = usePathname()
  
  // 🔥 INSTANT PERMISSION CHECKS (NO LOADING)
  const permissions = usePermissions([
    { resource: '/people/employees' },
    { resource: '/people/departments' },
    { resource: '/people/designations' }
  ])

  return (
    <div className="flex flex-wrap gap-2">
      {permissions["/people/employees.view"] && (
        <Link
          href="/people/employees"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pathname === "/people/employees"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          <Users className="mr-2 h-4 w-4" />
          Employees
        </Link>
      )}

      {permissions["/people/departments.view"] && (
        <Link
          href="/people/departments"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pathname === "/people/departments"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          <Building2 className="mr-2 h-4 w-4" />
          Departments
        </Link>
      )}

      {permissions["/people/designations.view"] && (
        <Link
          href="/people/designations"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pathname === "/people/designations"
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          <Briefcase className="mr-2 h-4 w-4" />
          Designations
        </Link>
      )}
    </div>
  )
}
