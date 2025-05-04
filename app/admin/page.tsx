import { getAdminSession } from "@/actions/admin-auth-actions"
import { redirect } from "next/navigation"

export default async function AdminIndexPage() {
  const session = await getAdminSession()

  if (session) {
    redirect("/admin/dashboard")
  } else {
    redirect("/admin/login")
  }
}
