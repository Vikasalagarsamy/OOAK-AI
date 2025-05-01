"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Users, Building2, Briefcase } from "lucide-react"
import { useState, useEffect } from "react"
import { getCurrentUser, checkPermissions } from "@/lib/permission-utils"

export function PeopleSubmenu() {
  const pathname = usePathname()
  const [permissions, setPermissions] = useState({
    employees: true,
    departments: true,
    designations: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPermissions() {
      try {
        const user = await getCurrentUser()

        if (!user) {
          setPermissions({
            employees: false,
            departments: false,
            designations: false,
          })
          setLoading(false)
          return
        }

        const permissionResults = await checkPermissions(user.id, [
          { path: "people.employees" },
          { path: "people.departments" },
          { path: "people.designations" },
        ])

        setPermissions({
          employees: permissionResults["people.employees"],
          departments: permissionResults["people.departments"],
          designations: permissionResults["people.designations"],
        })
      } catch (error) {
        console.error("Error loading permissions:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [])

  if (loading) {
    return <div className="h-10"></div>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {permissions.employees && (
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

      {permissions.departments && (
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

      {permissions.designations && (
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
