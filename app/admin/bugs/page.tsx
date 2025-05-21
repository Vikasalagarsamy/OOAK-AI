import { getBugs, getBugStats } from "@/actions/bug-actions"
import { BugListView } from "@/components/bugs/bug-list-view"
import { BugStatsCards } from "@/components/bugs/bug-stats-cards"
import { BugFilters } from "@/components/bugs/bug-filters"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import type { BugFilterParams } from "@/types/bug"

export default async function BugsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const user = await getCurrentUser()

  if (!user || user.roleName !== "Administrator") {
    redirect("/dashboard?error=insufficient_permissions")
  }

  // Parse query parameters for filtering
  const filters: BugFilterParams = {}

  if (searchParams.status) {
    filters.status = searchParams.status as any
  }

  if (searchParams.severity) {
    filters.severity = searchParams.severity as any
  }

  if (searchParams.assignee) {
    filters.assignee_id = searchParams.assignee as string
  }

  if (searchParams.search) {
    filters.search = searchParams.search as string
  }

  // Fetch bugs with filters
  const { success, data: bugs, error } = await getBugs(filters)

  // Fetch statistics
  const { data: stats } = await getBugStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Bug Management</h1>
      </div>

      {stats && <BugStatsCards stats={stats} />}

      <BugFilters initialFilters={filters} />

      {!success ? (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">Failed to load bugs: {error}</div>
      ) : (
        <BugListView bugs={bugs || []} />
      )}
    </div>
  )
}
