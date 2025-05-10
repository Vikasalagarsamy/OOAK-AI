import { MenuPermissionsManager } from "@/components/admin/menu-permissions-manager"

export default function RolePermissionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Role Permissions</h1>
      <MenuPermissionsManager />
    </div>
  )
}
