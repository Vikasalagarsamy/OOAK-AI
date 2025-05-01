"use client"

import { useState } from "react"
import type { Role } from "@/types/role"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, Trash2, Shield } from "lucide-react"
import { AddRoleDialog } from "@/components/add-role-dialog"
import { EditRoleDialog } from "@/components/edit-role-dialog"
import { DeleteRoleDialog } from "@/components/delete-role-dialog"
import { PermissionMatrixDialog } from "@/components/permission-matrix-dialog"

interface RoleListProps {
  roles: Role[]
  onRolesChange: (roles: Role[]) => void
}

export function RoleList({ roles, onRolesChange }: RoleListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const handleAddRole = (newRole: Role) => {
    // Assign a new ID (in a real app, this would be handled by the database)
    const maxId = roles.reduce((max, role) => (role.id > max ? role.id : max), 0)
    const roleWithId = { ...newRole, id: maxId + 1 }

    const updatedRoles = [...roles, roleWithId]
    onRolesChange(updatedRoles)
  }

  const handleEditRole = (updatedRole: Role) => {
    const updatedRoles = roles.map((role) => (role.id === updatedRole.id ? updatedRole : role))
    onRolesChange(updatedRoles)
  }

  const handleDeleteRole = (roleId: number) => {
    const updatedRoles = roles.filter((role) => role.id !== roleId)
    onRolesChange(updatedRoles)
  }

  const handleUpdatePermissions = (updatedRole: Role) => {
    const updatedRoles = roles.map((role) => (role.id === updatedRole.id ? updatedRole : role))
    onRolesChange(updatedRoles)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Available Roles</h2>
        <Button onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="border rounded-lg p-4 bg-card text-card-foreground shadow-sm transition-all hover:shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium">{role.name}</h3>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedRole(role)
                    setPermissionsDialogOpen(true)
                  }}
                  title="Manage Permissions"
                >
                  <Shield className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedRole(role)
                    setEditDialogOpen(true)
                  }}
                  title="Edit Role"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedRole(role)
                    setDeleteDialogOpen(true)
                  }}
                  title="Delete Role"
                  disabled={roles.length <= 1} // Prevent deleting the last role
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{role.description}</p>

            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between mb-1">
                <span>Access Level:</span>
                <span className="font-medium">{getAccessLevelLabel(role)}</span>
              </div>
              <div className="flex justify-between">
                <span>Permissions:</span>
                <span className="font-medium">{countPermissions(role)} configured</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Role Dialog */}
      <AddRoleDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAddRole={handleAddRole} />

      {/* Edit Role Dialog */}
      {selectedRole && (
        <EditRoleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          role={selectedRole}
          onUpdateRole={handleEditRole}
        />
      )}

      {/* Delete Role Dialog */}
      {selectedRole && (
        <DeleteRoleDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          role={selectedRole}
          onDeleteRole={handleDeleteRole}
        />
      )}

      {/* Permission Matrix Dialog */}
      {selectedRole && (
        <PermissionMatrixDialog
          open={permissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
          role={selectedRole}
          onUpdatePermissions={handleUpdatePermissions}
        />
      )}
    </div>
  )
}

// Helper function to determine the access level label
function getAccessLevelLabel(role: Role): string {
  const permissions = role.permissions || {}
  const hasFullAccess = Object.values(permissions).some((p) => p.view && p.read && p.write && p.delete)
  const hasWriteAccess = Object.values(permissions).some((p) => p.view && p.read && p.write)
  const hasReadAccess = Object.values(permissions).some((p) => p.view && p.read)

  if (hasFullAccess) return "Full Access"
  if (hasWriteAccess) return "Write Access"
  if (hasReadAccess) return "Read Access"
  return "Limited Access"
}

// Helper function to count configured permissions
function countPermissions(role: Role): number {
  const permissions = role.permissions || {}
  return Object.keys(permissions).length
}
