import { DirectSqlExecutor } from "@/components/admin/direct-sql-executor"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"

export default async function DirectSqlPage() {
  const user = await getCurrentUser()

  if (!user || user.roleName !== "Administrator") {
    redirect("/login")
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Direct SQL Execution</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <DirectSqlExecutor />
      </div>
    </div>
  )
}
