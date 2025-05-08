import { UserRoleAssignmentManager } from "@/components/admin/user-role-assignment-manager"

export default function RolePermissionsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Permissions</h1>
        <p className="text-muted-foreground">Manage menu access and permissions for different user roles</p>
      </div>

      <UserRoleAssignmentManager />
    </div>
  )
}
