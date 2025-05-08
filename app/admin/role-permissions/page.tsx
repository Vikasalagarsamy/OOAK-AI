import { RolePermissionManager } from "@/components/admin/role-permission-manager"
import { UserRoleAssignmentManager } from "@/components/admin/user-role-assignment-manager"

export default function RolePermissionsPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Role Permissions</h1>
      <div className="grid grid-cols-1 gap-8">
        <RolePermissionManager />
        <UserRoleAssignmentManager />
      </div>
    </div>
  )
}
