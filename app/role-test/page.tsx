"use client"

import { useRole } from "@/contexts/role-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RoleTestPage() {
  const { currentRole, filteredMenu } = useRole()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Role-Based Menu Testing</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Role</CardTitle>
            <CardDescription>Details about the currently selected role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {currentRole.name}
              </div>
              <div>
                <span className="font-medium">Description:</span> {currentRole.description}
              </div>
              <div>
                <span className="font-medium">Is Admin:</span> {currentRole.isAdmin ? "Yes" : "No"}
              </div>
              <div>
                <span className="font-medium">Permissions:</span> {currentRole.permissions.length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Menu Items</CardTitle>
            <CardDescription>Menu items visible to the current role</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {Object.keys(filteredMenu).map((key) => (
                <li key={key} className="p-2 bg-muted rounded-md">
                  {filteredMenu[key].name}

                  {filteredMenu[key].subMenus && filteredMenu[key].subMenus.length > 0 && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {filteredMenu[key].subMenus.map((subMenu) => (
                        <li key={subMenu.name} className="text-sm text-muted-foreground">
                          - {subMenu.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
