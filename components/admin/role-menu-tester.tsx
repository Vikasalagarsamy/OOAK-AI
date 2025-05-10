"use client"

import { useRole } from "@/contexts/role-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMenuIcon } from "@/components/dynamic-menu/get-menu-icon"

export function RoleMenuTester() {
  const { currentRole, filteredMenu, isAdmin } = useRole()

  // Convert the filtered menu structure to an array for easier mapping
  const mainMenuItems = Object.entries(filteredMenu).map(([name, item]) => ({
    name,
    ...item,
  }))

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Menu Test</CardTitle>
            <CardDescription>Testing menu permissions for current role</CardDescription>
          </div>
          <Badge variant={isAdmin ? "default" : "outline"}>{currentRole.name}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Current Role: {currentRole.name}</h3>
            <p className="text-sm text-muted-foreground">{currentRole.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {currentRole.permissions.map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Visible Menu Items ({mainMenuItems.length})</h3>
            <ul className="space-y-2">
              {mainMenuItems.map((item) => (
                <li key={item.name} className="text-sm">
                  <div className="flex items-center">
                    {getMenuIcon(item.icon)}
                    <span className="ml-2 font-medium">{item.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{item.path || "(parent menu)"}</span>
                  </div>
                  {item.subMenus && item.subMenus.length > 0 && (
                    <ul className="pl-6 mt-1 space-y-1 border-l border-border">
                      {item.subMenus.map((subItem) => (
                        <li key={subItem.name} className="text-sm">
                          <div className="flex items-center">
                            {getMenuIcon(subItem.icon)}
                            <span className="ml-2">{subItem.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{subItem.path}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
