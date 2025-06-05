"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Briefcase } from "lucide-react"
import { PeopleSubmenu } from "@/components/people/people-submenu"
import { getCurrentUser, checkPermissions } from "@/lib/permission-utils"
import { useToast } from "@/components/ui/use-toast"

export default function PeoplePage() {
  const [permissions, setPermissions] = useState({
    employees: true,
    departments: true,
    designations: true,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

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
        toast({
          title: "Error",
          description: "Failed to load permissions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadPermissions()
  }, [toast])

  if (loading) {
    return (
      <div className="container mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">People Management</h1>
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">People Management</h1>
        <p className="text-muted-foreground">Manage your organization's employees, departments, and designations.</p>
      </div>

      {/* The PeopleSubmenu component is kept for legacy purposes but can be optional now */}
      <PeopleSubmenu />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {permissions.employees && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Employees
              </CardTitle>
              <CardDescription>Manage your organization's employees</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm">
                Add, edit, and manage employee information, including personal details, contact information, and company
                allocations.
              </p>
              <Link href="/people/employees">
                <Button>Manage Employees</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {permissions.departments && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Departments
              </CardTitle>
              <CardDescription>Manage your organization's departments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm">
                Create and manage departments within your organization to better organize your workforce.
              </p>
              <Link href="/people/departments">
                <Button>Manage Departments</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {permissions.designations && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Designations
              </CardTitle>
              <CardDescription>Manage job designations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm">
                Define and manage job designations and roles within your organization's departments.
              </p>
              <Link href="/people/designations">
                <Button>Manage Designations</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
