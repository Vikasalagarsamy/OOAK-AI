import type { Metadata } from "next"
import { PermissionsManager } from "@/components/permissions/permissions-manager"

export const metadata: Metadata = {
  title: "Unified Permissions Manager",
  description: "Manage role-based permissions in a unified interface",
}

export default function UnifiedPermissionsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Unified Permissions Manager</h1>
      <p className="text-muted-foreground mb-8">
        Manage role-based permissions in a single, unified interface. This page allows you to configure which
        permissions are assigned to each role and track changes through the audit trail.
      </p>
      <PermissionsManager />
    </div>
  )
}
