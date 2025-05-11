"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import type { Permission, RolePermission } from "@/types/permissions"

interface PermissionsListProps {
  permissions: Permission[]
  rolePermissions: RolePermission[]
  onPermissionChange: (permissionId: number, status: string) => void
}

export function PermissionsList({ permissions, rolePermissions, onPermissionChange }: PermissionsListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Group permissions by resource
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = []
      }
      acc[permission.resource].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  // Check if a permission is enabled for the role
  const isPermissionEnabled = (permissionId: number) => {
    const rolePermission = rolePermissions.find((rp) => rp.permission_id === permissionId)
    return rolePermission?.status === "active"
  }

  // Filter permissions based on search term
  const filteredResources = Object.keys(groupedPermissions).filter((resource) => {
    if (!searchTerm) return true

    // Check if resource name matches search
    if (resource.toLowerCase().includes(searchTerm.toLowerCase())) return true

    // Check if any permission in this resource matches search
    return groupedPermissions[resource].some(
      (permission) =>
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  })

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search permissions..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No permissions found matching your search.</div>
      ) : (
        <div className="space-y-8">
          {filteredResources.map((resource) => (
            <div key={resource} className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                {resource}
                <Badge className="ml-2">{groupedPermissions[resource].length}</Badge>
              </h3>

              <div className="space-y-2">
                {groupedPermissions[resource].map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div>
                      <div className="font-medium">{permission.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="outline">{permission.action}</Badge>
                        {permission.description && <span>{permission.description}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id={`permission-${permission.id}`}
                        checked={isPermissionEnabled(permission.id)}
                        onCheckedChange={(checked) =>
                          onPermissionChange(permission.id, checked ? "active" : "inactive")
                        }
                      />
                      <Label htmlFor={`permission-${permission.id}`}>
                        {isPermissionEnabled(permission.id) ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
