import { RolePermissionManager } from "@/components/admin/role-permission-manager"
import { UserRoleAssignmentManager } from "@/components/admin/user-role-assignment-manager"
import { RoleManagement } from "@/components/admin/role-management"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function RolePermissionsPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Role Permissions</h1>
        <Button asChild>
          <Link href="/admin/roles/add" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Add New Role
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <RoleManagement />
        <RolePermissionManager />
        <UserRoleAssignmentManager />
      </div>
    </div>
  )
}
