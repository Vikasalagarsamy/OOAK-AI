import { MenuPermissionsChecker } from "@/components/admin/menu-permissions-checker"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"

export default async function CheckMenuPermissionsPage() {
  const user = await getCurrentUser()

  if (!user || user.roleName !== "Administrator") {
    redirect("/login")
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Check Menu Permissions</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <MenuPermissionsChecker />
      </div>
    </div>
  )
}
