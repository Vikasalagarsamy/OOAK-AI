import { CreateMenuPermissionsFunctions } from "@/components/admin/create-menu-permissions-functions"

export default function SetupMenuPermissionsPage() {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Setup Menu Permissions</h1>
        <p className="text-muted-foreground">
          Create or update the database functions needed for role-based menu permissions
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <CreateMenuPermissionsFunctions />
      </div>
    </div>
  )
}
