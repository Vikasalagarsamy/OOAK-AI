import { MenuPermissionsManager } from "@/components/admin/menu-permissions-manager"

export const metadata = {
  title: "Menu & Role Permissions",
  description: "Configure role-based menu permissions and access controls",
}

export default function MenuPermissionsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Menu & Role Permissions</h1>
      <p className="text-muted-foreground mb-8">
        Configure which menu items are visible to each role and what actions they can perform. This unified interface
        manages both menu visibility and role-based access controls.
      </p>
      <MenuPermissionsManager />
    </div>
  )
}
