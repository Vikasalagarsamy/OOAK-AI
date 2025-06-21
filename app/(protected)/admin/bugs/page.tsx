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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()

  if (!user || user.roleName !== "Administrator") {
    redirect("/dashboard?error=insufficient_permissions")
  }

  // Await searchParams for Next.js 15
  const resolvedSearchParams = await searchParams

  // Parse query parameters for filtering
  const filters: BugFilterParams = {}

  if (resolvedSearchParams.status) {
    filters.status = resolvedSearchParams.status as any
  }

  if (resolvedSearchParams.severity) {
    filters.severity = resolvedSearchParams.severity as any
  }

  if (resolvedSearchParams.assignee) {
    filters.assignee_id = resolvedSearchParams.assignee as string
  }

  if (resolvedSearchParams.search) {
    filters.search = resolvedSearchParams.search as string
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
