import { FixAllMenuPermissions } from "@/components/admin/fix-all-menu-permissions"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"

export default async function FixAllPermissionsPage() {
  const user = await getCurrentUser()

  if (!user || user.roleName !== "Administrator") {
    redirect("/login")
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Menu System Repair</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <FixAllMenuPermissions />
      </div>
    </div>
  )
}
