import { Suspense } from "react"
import { RealTimeDashboard } from "@/components/dashboard/real-time-dashboard"
import { getDashboardStats } from "@/services/dashboard-service"
import { Skeleton } from "@/components/ui/skeleton"

export const revalidate = 60 // Fallback revalidation if real-time updates fail

export default async function DashboardPage() {
  // Fetch initial data server-side
  const initialData = await getDashboardStats().catch((error) => {
    console.error("Error fetching initial dashboard data:", error)
    return null
  })

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <RealTimeDashboard initialData={initialData} />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-[250px] mb-2" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>

      <Skeleton className="h-[400px]" />
    </div>
  )
}
