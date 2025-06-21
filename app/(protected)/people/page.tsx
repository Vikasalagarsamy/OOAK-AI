"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, Briefcase, Plus, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePermissions } from "@/components/ultra-fast-auth-provider"

export default function PeoplePage() {
  // 🔥 INSTANT PERMISSION CHECKS (NO LOADING)
  const permissions = usePermissions([
    { resource: '/people/employees' },
    { resource: '/people/departments' },
    { resource: '/people/designations' }
  ])

  const sections = [
    {
      title: "Employees",
      description: "Manage employee information, roles, and assignments",
      icon: Users,
      href: "/people/employees",
      color: "bg-blue-500",
      enabled: permissions["/people/employees.view"],
      actions: [
        { label: "View All", href: "/people/employees" },
        { label: "Add New", href: "/people/employees/new", icon: Plus },
      ]
    },
    {
      title: "Departments",
      description: "Organize and manage company departments",
      icon: Building2,
      href: "/people/departments",
      color: "bg-green-500",
      enabled: permissions["/people/departments.view"],
      actions: [
        { label: "View All", href: "/people/departments" },
        { label: "Add New", href: "/people/departments/new", icon: Plus },
      ]
    },
    {
      title: "Designations",
      description: "Define job titles and position hierarchies",
      icon: Briefcase,
      href: "/people/designations",
      color: "bg-purple-500",
      enabled: permissions["/people/designations.view"],
      actions: [
        { label: "View All", href: "/people/designations" },
        { label: "Add New", href: "/people/designations/new", icon: Plus },
      ]
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">People Management</h1>
        <p className="text-muted-foreground">
          Manage your organization's people, departments, and roles
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          if (!section.enabled) return null

          const Icon = section.icon
          
          return (
            <Card key={section.title} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${section.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col space-y-2">
                  {section.actions.map((action) => {
                    const ActionIcon = action.icon
                    return (
                      <Button
                        key={action.label}
                        variant={action.icon ? "default" : "outline"}
                        size="sm"
                        asChild
                        className="justify-start"
                      >
                        <Link href={action.href}>
                          {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                          {action.label}
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Quick Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">--</div>
              <div className="text-sm text-blue-600">Total Employees</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">--</div>
              <div className="text-sm text-green-600">Departments</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">--</div>
              <div className="text-sm text-purple-600">Designations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
