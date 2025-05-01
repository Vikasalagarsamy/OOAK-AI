import { Suspense } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ChartCard } from "@/components/dashboard/chart-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { getRecentActivities } from "@/services/activity-service"
import { getDashboardStats } from "@/services/dashboard-service"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const revalidate = 60 // Revalidate this page every 60 seconds

export default async function DashboardPage() {
  // Fetch dashboard data
  const dashboardData = await getDashboardStats()
  const activities = await getRecentActivities(5)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Suspense fallback={<DashboardStatsSkeleton />}>
          <StatsCards stats={dashboardData.stats} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Suspense fallback={<ChartSkeleton />}>
          <ChartCard
            className="col-span-1 lg:col-span-2"
            employeesByDepartment={dashboardData.employeesByDepartment}
            branchesByCompany={dashboardData.branchesByCompany}
            employeeGrowth={dashboardData.employeeGrowth}
          />
        </Suspense>
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity activities={activities.length > 0 ? activities : dashboardData.recentActivities} />
        </Suspense>
      </div>

      <div className="mb-6">
        <QuickActions />
      </div>
    </div>
  )
}

function DashboardStatsSkeleton() {
  return (
    <>
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
    </>
  )
}

function ChartSkeleton() {
  return (
    <Card className="col-span-1 lg:col-span-2 overflow-hidden">
      <CardHeader>
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[350px] flex items-center justify-center">
          <div className="animate-pulse rounded-md bg-muted h-[300px] w-full mx-6"></div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex items-center gap-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}
