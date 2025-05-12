"use client"

import { useState } from "react"
import { useRole } from "@/contexts/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function RoleSwitcherPanel() {
  const { currentRole, setCurrentRole, availableRoles } = useRole()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" className="bg-white shadow-md border" onClick={() => setIsExpanded(true)}>
          Role Testing Panel
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Role Testing Panel</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsExpanded(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <CardDescription>Test UI with different permission levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Current Role</h3>
              <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                <Badge variant={currentRole.isAdmin ? "destructive" : "default"} className="capitalize">
                  {currentRole.name}
                </Badge>
                <span className="text-xs text-muted-foreground">{currentRole.description}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Available Roles</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((role) => (
                  <Button
                    key={role.id}
                    variant={currentRole.id === role.id ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "justify-start",
                      role.isAdmin && "border-red-200 hover:border-red-300",
                      role.id === "manager" && "border-green-200 hover:border-green-300",
                    )}
                    onClick={() => setCurrentRole(role)}
                  >
                    {role.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            The navigation menu will update based on the selected role's permissions
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
