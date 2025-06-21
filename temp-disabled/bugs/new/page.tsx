import { BugForm } from "@/components/bugs/bug-form"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"

export default async function NewBugPage() {
  const user = await getCurrentUser()

  if (!user || user.roleName !== "Administrator") {
    redirect("/dashboard?error=insufficient_permissions")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create New Bug</h1>
      </div>

      <BugForm />
    </div>
  )
}
