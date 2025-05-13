import { MenuPermissionsManager } from "@/components/admin/menu-permissions-manager"
import { AdminHeader } from "@/components/admin/admin-header"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Menu & Role Permissions",
  description: "Configure role-based menu permissions and access controls",
}

export default function MenuPermissionsPage() {
  return (
    <>
      <AdminHeader
        title="Menu & Role Permissions"
        description="Configure which menu items are visible to each role and what actions they can perform."
        icon={<Shield className="h-6 w-6" />}
      />

      <div className="mt-6">
        <MenuPermissionsManager />
      </div>
    </>
  )
}
