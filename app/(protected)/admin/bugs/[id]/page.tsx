import { getBugById } from "@/actions/bug-actions"
import { BugDetailView } from "@/components/bugs/bug-detail-view"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { bugService } from "@/services/bug-service"

export default async function BugDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user || user.roleName !== "Administrator") {
    redirect("/dashboard?error=insufficient_permissions")
  }

  const resolvedParams = await params
  const bugId = Number.parseInt(resolvedParams.id)
  const { success, data: bug } = await getBugById()

  if (!success || !bug) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Bug Not Found</h1>
        </div>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          {"The requested bug could not be found."}
        </div>
      </div>
    )
  }

  // Fetch comments and attachments
  const comments: any[] = []
  const attachments: any[] = []

  return (
    <div className="space-y-6">
      <BugDetailView bug={bug} comments={comments} attachments={attachments} />
    </div>
  )
}
