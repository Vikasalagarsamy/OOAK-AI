import { requireAdminAuth } from "@/actions/admin-auth-actions"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/admin/dashboard"

export const metadata = {
  title: "Admin Dashboard | Company Management System",
  description: "Administrative dashboard for system management",
}

export default async function AdminDashboardPage() {
  const { redirect: redirectPath, session } = await requireAdminAuth()

  if (redirectPath) {
    redirect(redirectPath)
  }

  return <AdminDashboard session={session} />
}
