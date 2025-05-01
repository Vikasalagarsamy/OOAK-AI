import { Suspense } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { ChartCard } from "@/components/dashboard/chart-card"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { getRecentActivities } from "@/services/activity-service"
import { getDashboardStats } from "@/services/dashboard-service"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorBoundary } from "@/components/error-boundary"

export const revalidate = 60 // Revalidate this page every 60 seconds

export default async function DashboardPage() {
  // Fetch dashboard data with error handling
  let dashboardData
  let activities = []

  try {
    dashboardData = await getDashboardStats()
    activities = await getRecentActivities(5)
  } catch (error) {
    console.error("Error loading dashboard data:", error)
    // Set default data
    dashboardData = {
      stats: {
        companies: { count: 0, trend: { isPositive: true, value: 0 } },
        branches: { count: 0, trend: { isPositive: true, value: 0 } },
        employees: { count: 0, trend: { isPositive: true, value: 0 } },
        clients: { count: 0, trend: { isPositive: true, value: 0 } },
      },
      employeesByDepartment: [
        { department: "Engineering", count: 24 },
        { department: "Marketing", count: 13 },
        { department: "Sales", count: 18 },
        { department: "Finance", count: 8 },
        { department: "HR", count: 5 },
      ],
      branchesByCompany: [
        { company: "Acme Corp", count: 5 },
        { company: "TechCorp", count: 3 },
        { company: "Global Industries", count: 7 },
        { company: "Startup Inc", count: 1 },
        { company: "Enterprise Ltd", count: 4 },
      ],
      employeeGrowth: [
        { month: "Jan", count: 42 },
        { month: "Feb", count: 47 },
        { month: "Mar", count: 53 },
        { month: "Apr", count: 58 },
        { month: "May", count: 62 },
        { month: "Jun", count: 68 },
      ],
      recentActivities: [],
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ErrorBoundary fallback={<DashboardStatsSkeleton />}>
          <Suspense fallback={<DashboardStatsSkeleton />}>
            <StatsCards stats={dashboardData.stats} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ErrorBoundary fallback={<ChartSkeleton />}>
          <Suspense fallback={<ChartSkeleton />}>
            <ChartCard
              className="col-span-1 lg:col-span-2"
              employeesByDepartment={dashboardData.employeesByDepartment}
              branchesByCompany={dashboardData.branchesByCompany}
              employeeGrowth={dashboardData.employeeGrowth}
            />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary fallback={<ActivitySkeleton />}>
          <Suspense fallback={<ActivitySkeleton />}>
            <RecentActivity activities={activities.length > 0 ? activities : dashboardData.recentActivities} />
          </Suspense>
        </ErrorBoundary>
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
