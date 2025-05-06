import type { Metadata } from "next"
import { MenuPermissionsManager } from "@/components/admin/menu-permissions-manager"

export const metadata: Metadata = {
  title: "Menu Permissions Manager",
  description: "Manage role-based menu permissions",
}

export default function MenuPermissionsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Menu Permissions Manager</h1>
      <MenuPermissionsManager />
    </div>
  )
}
