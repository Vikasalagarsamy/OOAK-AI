import { FixUsersByRole } from "@/components/admin/fix-users-by-role"

export default function FixUsersByRolePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Fix Users by Role Function</h1>
      <p className="mb-6 text-muted-foreground">
        This page helps you fix the missing database function that's needed to display users by role. Click the button
        below to create the necessary function.
      </p>

      <div className="p-6 border rounded-lg bg-card">
        <FixUsersByRole />
      </div>
    </div>
  )
}
