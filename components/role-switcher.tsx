"use client"

import { useRole } from "@/contexts/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RoleSwitcher() {
  const { currentRole, setCurrentRole, availableRoles } = useRole()

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Role-Based Menu Testing</CardTitle>
        <CardDescription>
          Switch between different roles to see how the menu changes based on permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Current Role</h3>
            <div className="flex items-center gap-2">
              <Badge variant={currentRole.isAdmin ? "destructive" : "default"}>{currentRole.name}</Badge>
              <span className="text-sm text-muted-foreground">{currentRole.description}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Available Roles</h3>
            <div className="flex flex-wrap gap-2">
              {availableRoles.map((role) => (
                <Button
                  key={role.id}
                  variant={currentRole.id === role.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentRole(role)}
                >
                  {role.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          The navigation menu will update based on the selected role's permissions
        </div>
      </CardFooter>
    </Card>
  )
}
