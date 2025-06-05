import { RoleManager } from "@/components/organization/role-manager"

export default function RolesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user roles and permissions for all application modules. This system is automatically synchronized 
          with the complete navigation structure including Sales, Accounting, Post-Sales, Events, Reports, and all other sections.
        </p>
      </div>
      <RoleManager />
    </div>
  )
}
