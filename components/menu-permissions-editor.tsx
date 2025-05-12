"use client"

import { useState, useEffect } from "react"
import type { MenuItem, Role, RolePermission } from "@/types/menu-permissions"
import { updateMenuPermission } from "@/services/menu-service"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

interface MenuPermissionsEditorProps {
  menuItem: MenuItem | null
  roles: Role[]
  permissions: RolePermission[]
  onPermissionsUpdated: () => void
}

export function MenuPermissionsEditor({
  menuItem,
  roles,
  permissions,
  onPermissionsUpdated,
}: MenuPermissionsEditorProps) {
  const [localPermissions, setLocalPermissions] = useState<RolePermission[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setLocalPermissions(permissions)
  }, [permissions])

  if (!menuItem) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">Select a menu item to manage permissions</p>
      </div>
    )
  }

  const handlePermissionChange = async (
    roleId: number,
    permissionType: "canView" | "canAdd" | "canEdit" | "canDelete",
    value: boolean,
  ) => {
    const updatedPermissions = localPermissions.map((perm) => {
      if (perm.roleId === roleId && perm.menuItemId === menuItem.id) {
        return { ...perm, [permissionType]: value }
      }
      return perm
    })

    setLocalPermissions(updatedPermissions)

    const permissionToUpdate = updatedPermissions.find((p) => p.roleId === roleId && p.menuItemId === menuItem.id)

    if (permissionToUpdate) {
      setIsLoading(true)
      try {
        const success = await updateMenuPermission(permissionToUpdate)
        if (success) {
          toast({
            title: "Permission updated",
            description: `Updated ${permissionType} for ${roles.find((r) => r.id === roleId)?.name}`,
          })
          onPermissionsUpdated()
        } else {
          toast({
            title: "Error",
            description: "Failed to update permission",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error updating permission:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const getPermissionForRole = (roleId: number) => {
    return (
      localPermissions.find((p) => p.roleId === roleId && p.menuItemId === menuItem.id) || {
        roleId,
        menuItemId: menuItem.id,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      }
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-2">Permissions for {menuItem.name}</h2>
      {menuItem.path && <p className="text-sm text-gray-500 mb-4">Path: {menuItem.path}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-center">View</th>
              <th className="p-2 text-center">Add</th>
              <th className="p-2 text-center">Edit</th>
              <th className="p-2 text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const permission = getPermissionForRole(role.id)
              return (
                <tr key={role.id} className="border-t">
                  <td className="p-2">{role.name}</td>
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={permission.canView}
                      disabled={isLoading}
                      onCheckedChange={(checked) => handlePermissionChange(role.id, "canView", checked === true)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={permission.canAdd}
                      disabled={isLoading}
                      onCheckedChange={(checked) => handlePermissionChange(role.id, "canAdd", checked === true)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={permission.canEdit}
                      disabled={isLoading}
                      onCheckedChange={(checked) => handlePermissionChange(role.id, "canEdit", checked === true)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={permission.canDelete}
                      disabled={isLoading}
                      onCheckedChange={(checked) => handlePermissionChange(role.id, "canDelete", checked === true)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
